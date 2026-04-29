import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';

interface StatsParams {
  statusFilter: ProductStatus[];
  groupBy?: 'categoryId' | 'status';
  categoryId?: number;
}

// Define las interfaces para los resultados agrupados y el resultado total del servicio
export interface GroupedResult {
  categoryId?: number | null;
  status?: ProductStatus | null;
  _count: {
    _all: number;
  };
}

export interface FetchProductStatsResult {
  total: number;
  grouped?: GroupedResult[];
}

/**
 * Obtiene estadísticas de productos de la base de datos según los filtros.
 *
 * @param params - Objeto que contiene el filtro de estado y el campo opcional para agrupar.
 * @returns Una promesa que resuelve a un objeto con el total de productos y, opcionalmente, los resultados agrupados.
 *
 * @param statusFilter - Array de estados a incluir en el conteo.
 * @param groupBy - Campo opcional por el cual agrupar los resultados.
 * @returns Una promesa que resuelve a las estadísticas crudas.
 */
export const fetchProductStats = async ({
  statusFilter,
  groupBy,
  categoryId,
}: StatsParams): Promise<FetchProductStatsResult> => {
  const where: Prisma.ProductWhereInput = {
    status: {
      in: statusFilter,
    },
  };

  // Add categoryId to the where clause if provided
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const totalPromise = prisma.product.count({ where });

  if (groupBy) {
    const by: Prisma.ProductScalarFieldEnum[] = [groupBy];
    const groupedPromise = prisma.product.groupBy({
      by,
      where,
      _count: {
        _all: true,
      },
    });
    const [total, grouped] = await Promise.all([totalPromise, groupedPromise]);
    return { total, grouped };
  }

  const total = await totalPromise;
  return { total, grouped: undefined };
};

/**
 * Obtiene todas las categorías para crear un mapa de sus IDs a nombres.
 * @returns Una promesa que resuelve a un Mapa de IDs de categoría a nombres.
 */
export const getCategoryMap = async (): Promise<Map<number, string>> => {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  return new Map(categories.map((c) => [c.id, c.name]));
};

/**
 * Busca una categoría por su ID.
 * @param id - El ID de la categoría.
 * @returns La categoría encontrada o null.
 */
export const findCategoryById = async (id: number) => {
  return prisma.category.findUnique({ where: { id } });
};
