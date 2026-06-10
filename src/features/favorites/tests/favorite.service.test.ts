import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import {
  getUserFavoritesService,
  addFavoriteService,
  removeFavoriteService,
} from '../services/favorite.service';

// Mockea el cliente de Prisma para aislar el servicio de favoritos de la base de
// datos real.
jest.mock('../../../config/prisma', () => ({
  prisma: {
    favorite: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    systemSetting: { findUnique: jest.fn() },
    product: { findUnique: jest.fn() },
  },
}));

const mockedFavorite = prisma.favorite as jest.Mocked<typeof prisma.favorite>;
const mockedSetting = prisma.systemSetting as jest.Mocked<
  typeof prisma.systemSetting
>;
const mockedProduct = prisma.product as jest.Mocked<typeof prisma.product>;

// Crea un valor con forma de Prisma.Decimal a partir de un número.
const dec = (n: number) => ({ toNumber: () => n }) as unknown as Prisma.Decimal;

// Construye un favorito con su producto incluido para las pruebas de mapeo.
const buildFavoriteWithProduct = () => ({
  id: 1,
  userId: 'user-1',
  productId: 'prod-1',
  createdAt: new Date(),
  product: {
    id: 'prod-1',
    baseWeight: dec(2),
    additionalValue: dec(100000),
    discountValue: dec(50000),
    status: 'AVAILABLE',
    category: { parent: null },
  },
});

describe('Favorite Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserFavoritesService', () => {
    // Si el usuario no tiene favoritos, devuelve un arreglo vacío sin consultar
    // el precio del oro.
    it('devuelve un arreglo vacío cuando no hay favoritos', async () => {
      mockedFavorite.findMany.mockResolvedValue([]);

      const result = await getUserFavoritesService('user-1');

      expect(result).toEqual([]);
      expect(mockedSetting.findUnique).not.toHaveBeenCalled();
    });

    // Por defecto solo trae favoritos de productos disponibles (vista tienda).
    it('filtra por productos AVAILABLE por defecto', async () => {
      mockedFavorite.findMany.mockResolvedValue([]);

      await getUserFavoritesService('user-1');

      expect(mockedFavorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', product: { status: 'AVAILABLE' } },
        }),
      );
    });

    // Con onlyAvailable=false (vista admin) no filtra por estado del producto.
    it('no filtra por estado cuando onlyAvailable es false', async () => {
      mockedFavorite.findMany.mockResolvedValue([]);

      await getUserFavoritesService('user-1', { onlyAvailable: false });

      expect(mockedFavorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    // Calcula el precio de cada favorito usando el precio del oro configurado.
    it('mapea cada favorito con su precio calculado y final', async () => {
      mockedFavorite.findMany.mockResolvedValue([
        buildFavoriteWithProduct(),
      ] as never);
      mockedSetting.findUnique.mockResolvedValue({
        goldPricePerGram: dec(350000),
      } as never);

      const result = await getUserFavoritesService('user-1');

      // (2 * 350000) + 100000 = 800000; final = 800000 - 50000 = 750000.
      expect(result[0].product.calculatedPrice).toBe(800000);
      expect(result[0].product.finalPrice).toBe(750000);
    });
  });

  describe('addFavoriteService', () => {
    // Si el producto no existe, lanza un error de producto no encontrado.
    it('lanza PRODUCT_NOT_FOUND cuando el producto no existe', async () => {
      mockedProduct.findUnique.mockResolvedValue(null);

      await expect(addFavoriteService('user-1', 'prod-x')).rejects.toMatchObject(
        { status: 404 },
      );
    });

    // Si el producto no está disponible, lanza una restricción de negocio (400).
    it('lanza error 400 cuando el producto no está disponible', async () => {
      mockedProduct.findUnique.mockResolvedValue({
        id: 'prod-1',
        status: 'HIDDEN',
      } as never);

      await expect(
        addFavoriteService('user-1', 'prod-1'),
      ).rejects.toMatchObject({ status: 400 });
    });

    // Si ya es favorito, lanza un conflicto (409).
    it('lanza FAVORITE_ALREADY_EXISTS cuando ya es favorito', async () => {
      mockedProduct.findUnique.mockResolvedValue({
        id: 'prod-1',
        status: 'AVAILABLE',
      } as never);
      mockedFavorite.findUnique.mockResolvedValue({ id: 1 } as never);

      await expect(
        addFavoriteService('user-1', 'prod-1'),
      ).rejects.toMatchObject({ status: 409 });
    });

    // En el camino feliz, crea y devuelve el favorito.
    it('crea el favorito cuando el producto es válido y no existe aún', async () => {
      mockedProduct.findUnique.mockResolvedValue({
        id: 'prod-1',
        status: 'AVAILABLE',
      } as never);
      mockedFavorite.findUnique.mockResolvedValue(null);
      const created = { id: 5, userId: 'user-1', productId: 'prod-1' };
      mockedFavorite.create.mockResolvedValue(created as never);

      const result = await addFavoriteService('user-1', 'prod-1');

      expect(result).toEqual(created);
      expect(mockedFavorite.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', productId: 'prod-1' },
      });
    });

    // Una colisión por la restricción única (P2002) también se traduce a 409.
    it('traduce el error P2002 de Prisma a un conflicto 409', async () => {
      mockedProduct.findUnique.mockResolvedValue({
        id: 'prod-1',
        status: 'AVAILABLE',
      } as never);
      mockedFavorite.findUnique.mockResolvedValue(null);
      mockedFavorite.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: '4.15.0',
        }),
      );

      await expect(
        addFavoriteService('user-1', 'prod-1'),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('removeFavoriteService', () => {
    // Si el favorito no existe, lanza un error de no encontrado (404).
    it('lanza FAVORITE_NOT_FOUND cuando el favorito no existe', async () => {
      mockedFavorite.findUnique.mockResolvedValue(null);

      await expect(
        removeFavoriteService('user-1', 'prod-1'),
      ).rejects.toMatchObject({ status: 404 });
      expect(mockedFavorite.delete).not.toHaveBeenCalled();
    });

    // Si existe, lo elimina y devuelve true.
    it('elimina el favorito existente y devuelve true', async () => {
      mockedFavorite.findUnique.mockResolvedValue({ id: 7 } as never);
      mockedFavorite.delete.mockResolvedValue({ id: 7 } as never);

      const result = await removeFavoriteService('user-1', 'prod-1');

      expect(result).toBe(true);
      expect(mockedFavorite.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    });
  });
});
