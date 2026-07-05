import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import {
  getFeaturedProductsService,
  addFeaturedProductService,
  removeFeaturedProductService,
  removeFeaturedProductIfPresent,
  reorderFeaturedProductsService,
} from '../services/featured-product.service';

// Mockea el cliente de Prisma para aislar el servicio de productos destacados.
jest.mock('../../../config/prisma', () => ({
  prisma: {
    featuredProduct: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    systemSetting: { findUnique: jest.fn() },
    product: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const mockedFeatured = prisma.featuredProduct as jest.Mocked<
  typeof prisma.featuredProduct
>;
const mockedSetting = prisma.systemSetting as jest.Mocked<
  typeof prisma.systemSetting
>;
const mockedProduct = prisma.product as jest.Mocked<typeof prisma.product>;
const mockedTransaction = prisma.$transaction as jest.Mock;

const dec = (n: number) => ({ toNumber: () => n }) as unknown as Prisma.Decimal;

const availableProduct = {
  id: 'prod-1',
  status: 'AVAILABLE',
  baseWeight: dec(2),
  additionalValue: dec(100000),
  discountValue: dec(0),
};

describe('Featured Product Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFeaturedProductsService', () => {
    // Sin destacados, devuelve un arreglo vacío.
    it('devuelve un arreglo vacío cuando no hay destacados', async () => {
      mockedFeatured.findMany.mockResolvedValue([]);

      const result = await getFeaturedProductsService();

      expect(result).toEqual([]);
    });
  });

  describe('addFeaturedProductService', () => {
    // Producto inexistente -> 404.
    it('lanza 404 cuando el producto no existe', async () => {
      mockedProduct.findUnique.mockResolvedValue(null);

      await expect(addFeaturedProductService('x')).rejects.toMatchObject({
        status: 404,
      });
    });

    // Producto no disponible -> 400.
    it('lanza 400 cuando el producto no está disponible', async () => {
      mockedProduct.findUnique.mockResolvedValue({
        id: 'p',
        status: 'HIDDEN',
      } as never);

      await expect(addFeaturedProductService('p')).rejects.toMatchObject({
        status: 400,
      });
    });

    // Ya destacado -> 409.
    it('lanza 409 cuando el producto ya está destacado', async () => {
      mockedProduct.findUnique.mockResolvedValue(availableProduct as never);
      mockedFeatured.findUnique.mockResolvedValue({ id: 1 } as never);

      await expect(addFeaturedProductService('prod-1')).rejects.toMatchObject({
        status: 409,
      });
    });

    // Límite de 6 alcanzado -> 400.
    it('lanza 400 cuando ya hay 6 destacados', async () => {
      mockedProduct.findUnique.mockResolvedValue(availableProduct as never);
      mockedFeatured.findUnique.mockResolvedValue(null);
      mockedFeatured.count.mockResolvedValue(6);

      await expect(addFeaturedProductService('prod-1')).rejects.toMatchObject({
        status: 400,
      });
    });

    // Camino feliz: crea el destacado en la siguiente posición libre.
    it('crea el destacado en la siguiente posición', async () => {
      mockedProduct.findUnique.mockResolvedValue(availableProduct as never);
      mockedFeatured.findUnique.mockResolvedValue(null);
      mockedFeatured.count.mockResolvedValue(2);
      mockedFeatured.aggregate.mockResolvedValue({
        _max: { position: 2 },
      } as never);
      mockedFeatured.create.mockResolvedValue({
        id: 3,
        productId: 'prod-1',
        position: 3,
        product: availableProduct,
      } as never);
      mockedSetting.findUnique.mockResolvedValue({
        goldPricePerGram: dec(350000),
      } as never);

      const result = await addFeaturedProductService('prod-1');

      expect(mockedFeatured.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { productId: 'prod-1', position: 3 },
        }),
      );
      // (2 * 350000) + 100000 = 800000.
      expect(result.product.calculatedPrice).toBe(800000);
    });
  });

  describe('removeFeaturedProductService', () => {
    // No existe -> 404.
    it('lanza 404 cuando el destacado no existe', async () => {
      mockedFeatured.findUnique.mockResolvedValue(null);

      await expect(removeFeaturedProductService('x')).rejects.toMatchObject({
        status: 404,
      });
    });

    // Camino feliz: ejecuta la transacción de borrado y recompactado.
    it('elimina el destacado dentro de una transacción', async () => {
      mockedFeatured.findUnique.mockResolvedValue({
        productId: 'prod-1',
        position: 1,
      } as never);
      const tx = {
        featuredProduct: {
          delete: jest.fn().mockResolvedValue({}),
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      mockedTransaction.mockImplementation(async (cb) => cb(tx));

      await removeFeaturedProductService('prod-1');

      expect(tx.featuredProduct.delete).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
      });
    });
  });

  describe('removeFeaturedProductIfPresent', () => {
    // No estaba destacado -> no hace nada y NO lanza (idempotente).
    it('no hace nada cuando el producto no estaba destacado', async () => {
      mockedFeatured.findUnique.mockResolvedValue(null);

      await expect(
        removeFeaturedProductIfPresent('x'),
      ).resolves.toBeUndefined();
      expect(mockedTransaction).not.toHaveBeenCalled();
    });

    // Estaba destacado -> borra y recompacta posiciones de los posteriores.
    it('borra el destacado y recompacta posiciones cuando existía', async () => {
      mockedFeatured.findUnique.mockResolvedValue({
        productId: 'prod-1',
        position: 1,
      } as never);
      const tx = {
        featuredProduct: {
          delete: jest.fn().mockResolvedValue({}),
          findMany: jest.fn().mockResolvedValue([
            { productId: 'prod-2', position: 2 },
            { productId: 'prod-3', position: 3 },
          ]),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      mockedTransaction.mockImplementation(async (cb) => cb(tx));

      await removeFeaturedProductIfPresent('prod-1');

      expect(tx.featuredProduct.delete).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
      });
      // Los posteriores bajan una posición: 2->1 y 3->2.
      expect(tx.featuredProduct.update).toHaveBeenCalledWith({
        where: { productId: 'prod-2' },
        data: { position: 1 },
      });
      expect(tx.featuredProduct.update).toHaveBeenCalledWith({
        where: { productId: 'prod-3' },
        data: { position: 2 },
      });
    });
  });

  describe('reorderFeaturedProductsService', () => {
    // productId duplicados -> 400.
    it('rechaza productId duplicados', async () => {
      const items = [
        { productId: 'a', position: 1 },
        { productId: 'a', position: 2 },
      ];

      await expect(reorderFeaturedProductsService(items)).rejects.toMatchObject({
        status: 400,
      });
    });

    // Posiciones duplicadas -> 400.
    it('rechaza posiciones duplicadas', async () => {
      const items = [
        { productId: 'a', position: 1 },
        { productId: 'b', position: 1 },
      ];

      await expect(reorderFeaturedProductsService(items)).rejects.toMatchObject({
        status: 400,
      });
    });

    // Posiciones no contiguas -> 400.
    it('rechaza posiciones no contiguas', async () => {
      const items = [
        { productId: 'a', position: 1 },
        { productId: 'b', position: 3 },
      ];

      await expect(reorderFeaturedProductsService(items)).rejects.toMatchObject({
        status: 400,
      });
    });

    // No se envían todos los destacados existentes -> 400.
    it('rechaza cuando no se envían todos los destacados', async () => {
      const items = [
        { productId: 'a', position: 1 },
        { productId: 'b', position: 2 },
      ];
      mockedFeatured.count.mockResolvedValue(3);

      await expect(reorderFeaturedProductsService(items)).rejects.toMatchObject({
        status: 400,
      });
    });

    // Alguno de los productos no existe en destacados -> 404.
    it('lanza 404 cuando algún destacado no existe', async () => {
      const items = [
        { productId: 'a', position: 1 },
        { productId: 'b', position: 2 },
      ];
      mockedFeatured.count.mockResolvedValue(2);
      mockedFeatured.findMany.mockResolvedValueOnce([
        { productId: 'a' },
      ] as never);

      await expect(reorderFeaturedProductsService(items)).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});
