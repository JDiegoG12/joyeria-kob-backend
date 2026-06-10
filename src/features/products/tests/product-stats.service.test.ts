import { ProductStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import {
  fetchProductStats,
  getCategoryMap,
  findCategoryById,
  getDescendantCategoryIds,
  getTopFavoriteProducts,
} from '../services/product-stats.service';

// Mockea el cliente de Prisma para aislar el servicio de estadísticas.
jest.mock('../../../config/prisma', () => ({
  prisma: {
    product: { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn() },
    category: { findMany: jest.fn(), findUnique: jest.fn() },
  },
}));

const mockedProduct = prisma.product as jest.Mocked<typeof prisma.product>;
const mockedCategory = prisma.category as jest.Mocked<typeof prisma.category>;

describe('Product Stats Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProductStats', () => {
    // Sin agrupación, solo cuenta el total y no agrupa.
    it('devuelve solo el total cuando no se agrupa', async () => {
      mockedProduct.count.mockResolvedValue(7);

      const result = await fetchProductStats({
        statusFilter: [ProductStatus.AVAILABLE],
      });

      expect(result).toEqual({ total: 7, grouped: undefined });
      expect(mockedProduct.groupBy).not.toHaveBeenCalled();
    });

    // Con agrupación, devuelve el total y los grupos.
    it('devuelve total y grupos cuando se agrupa', async () => {
      mockedProduct.count.mockResolvedValue(5);
      const grouped = [{ status: 'AVAILABLE', _count: { _all: 5 } }];
      mockedProduct.groupBy.mockResolvedValue(grouped as never);

      const result = await fetchProductStats({
        statusFilter: [ProductStatus.AVAILABLE],
        groupBy: 'status',
      });

      expect(result.total).toBe(5);
      expect(result.grouped).toEqual(grouped);
    });

    // Cuando se pasan categoryIds, los incluye en el filtro `where`.
    it('filtra por categoryIds cuando se proporcionan', async () => {
      mockedProduct.count.mockResolvedValue(2);

      await fetchProductStats({
        statusFilter: [ProductStatus.AVAILABLE],
        categoryIds: [1, 2],
      });

      expect(mockedProduct.count).toHaveBeenCalledWith({
        where: {
          status: { in: [ProductStatus.AVAILABLE] },
          categoryId: { in: [1, 2] },
        },
      });
    });
  });

  describe('getCategoryMap', () => {
    // Construye un mapa de id de categoría a nombre.
    it('mapea ids de categoría a nombres', async () => {
      mockedCategory.findMany.mockResolvedValue([
        { id: 1, name: 'Anillos' },
        { id: 2, name: 'Collares' },
      ] as never);

      const map = await getCategoryMap();

      expect(map.get(1)).toBe('Anillos');
      expect(map.get(2)).toBe('Collares');
    });
  });

  describe('findCategoryById', () => {
    // Busca una categoría por su id.
    it('consulta la categoría por id', async () => {
      mockedCategory.findUnique.mockResolvedValue({ id: 3 } as never);

      const result = await findCategoryById(3);

      expect(mockedCategory.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
      });
      expect(result).toEqual({ id: 3 });
    });
  });

  describe('getDescendantCategoryIds', () => {
    // Recorre el árbol (BFS) e incluye la categoría inicial y sus descendientes.
    it('devuelve la categoría y todos sus descendientes', async () => {
      // Hijos de 1 -> [2, 3]; hijos de 2 -> []; hijos de 3 -> [].
      mockedCategory.findMany
        .mockResolvedValueOnce([{ id: 2 }, { id: 3 }] as never)
        .mockResolvedValueOnce([] as never)
        .mockResolvedValueOnce([] as never);

      const result = await getDescendantCategoryIds(1);

      expect(result).toEqual([1, 2, 3]);
    });

    // Una categoría hoja devuelve solo su propio id.
    it('devuelve solo su id cuando no tiene hijos', async () => {
      mockedCategory.findMany.mockResolvedValueOnce([] as never);

      const result = await getDescendantCategoryIds(9);

      expect(result).toEqual([9]);
    });
  });

  describe('getTopFavoriteProducts', () => {
    // Aplana el _count.favorites en favoritesCount.
    it('mapea el conteo de favoritos a favoritesCount', async () => {
      mockedProduct.findMany.mockResolvedValue([
        { id: 'p1', name: 'Anillo', _count: { favorites: 9 } },
      ] as never);

      const result = await getTopFavoriteProducts(5);

      expect(result).toEqual([
        { productId: 'p1', name: 'Anillo', favoritesCount: 9 },
      ]);
    });
  });
});
