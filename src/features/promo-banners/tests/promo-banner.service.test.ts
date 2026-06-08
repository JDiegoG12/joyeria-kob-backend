import {
  getMaxPromoBannerPosition,
  deletePromoBannerAndShift,
  reorderPromoBanners,
  productExists,
  categoryExists,
} from '../services/promo-banner.service';
import { prisma } from '../../../config/prisma';

// Mockea el cliente de Prisma para aislar el servicio de la base de datos real.
jest.mock('../../../config/prisma', () => {
  const promoBanner = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  };
  const product = { count: jest.fn() };
  const category = { count: jest.fn() };
  return {
    prisma: {
      promoBanner,
      product,
      category,
      // El transaction ejecuta el callback con el mismo cliente mockeado.
      $transaction: jest.fn(async (cb: (tx: unknown) => unknown) =>
        cb({ promoBanner }),
      ),
    },
  };
});

const mockedPromoBanner = prisma.promoBanner as unknown as {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  aggregate: jest.Mock;
};
const mockedProduct = prisma.product as unknown as { count: jest.Mock };
const mockedCategory = prisma.category as unknown as { count: jest.Mock };

describe('PromoBanner Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMaxPromoBannerPosition', () => {
    it('devuelve la posición máxima cuando existen banners', async () => {
      mockedPromoBanner.aggregate.mockResolvedValue({
        _max: { position: 5 },
      });
      await expect(getMaxPromoBannerPosition()).resolves.toBe(5);
    });

    it('devuelve 0 cuando no hay banners', async () => {
      mockedPromoBanner.aggregate.mockResolvedValue({
        _max: { position: null },
      });
      await expect(getMaxPromoBannerPosition()).resolves.toBe(0);
    });
  });

  describe('deletePromoBannerAndShift', () => {
    it('elimina el banner y compacta las posiciones posteriores', async () => {
      mockedPromoBanner.delete.mockResolvedValue({});
      // Tras borrar la posición 2, las posiciones 3 y 4 deben bajar a 2 y 3.
      mockedPromoBanner.findMany.mockResolvedValue([
        { id: 30, position: 3 },
        { id: 40, position: 4 },
      ]);
      mockedPromoBanner.update.mockResolvedValue({});

      await deletePromoBannerAndShift(20, 2);

      expect(mockedPromoBanner.delete).toHaveBeenCalledWith({
        where: { id: 20 },
      });
      expect(mockedPromoBanner.update).toHaveBeenCalledWith({
        where: { id: 30 },
        data: { position: 2 },
      });
      expect(mockedPromoBanner.update).toHaveBeenCalledWith({
        where: { id: 40 },
        data: { position: 3 },
      });
    });
  });

  describe('reorderPromoBanners', () => {
    it('aplica doble pasada (negativos y luego finales) para evitar choques de unicidad', async () => {
      mockedPromoBanner.update.mockResolvedValue({});
      const items = [
        { id: 1, position: 2 },
        { id: 2, position: 1 },
      ];

      await reorderPromoBanners(items);

      // Primera pasada: posiciones negativas.
      expect(mockedPromoBanner.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { position: -2 },
      });
      expect(mockedPromoBanner.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { position: -1 },
      });
      // Segunda pasada: posiciones finales.
      expect(mockedPromoBanner.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { position: 2 },
      });
      expect(mockedPromoBanner.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { position: 1 },
      });
      // 2 items × 2 pasadas = 4 updates.
      expect(mockedPromoBanner.update).toHaveBeenCalledTimes(4);
    });
  });

  describe('productExists / categoryExists', () => {
    it('productExists es true cuando count > 0', async () => {
      mockedProduct.count.mockResolvedValue(1);
      await expect(productExists('uuid')).resolves.toBe(true);
    });

    it('productExists es false cuando count = 0', async () => {
      mockedProduct.count.mockResolvedValue(0);
      await expect(productExists('uuid')).resolves.toBe(false);
    });

    it('categoryExists refleja el conteo', async () => {
      mockedCategory.count.mockResolvedValue(1);
      await expect(categoryExists(3)).resolves.toBe(true);
      mockedCategory.count.mockResolvedValue(0);
      await expect(categoryExists(3)).resolves.toBe(false);
    });
  });
});
