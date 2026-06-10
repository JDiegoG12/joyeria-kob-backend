import { ProductStatus } from '@prisma/client';

/**
 * Parámetros de consulta para las estadísticas de productos.
 * `agrupar` define el criterio de agrupación; `estado` y `categoryId` filtran
 * los productos considerados.
 */
export interface StatsQueryDTO {
  agrupar?: 'categoria' | 'estado';
  estado?: ProductStatus;
  categoryId?: number;
}

/**
 * Respuesta de estadísticas: total de productos y, opcionalmente, los conteos
 * agrupados por categoría o por estado.
 */
export interface StatsResponseDTO {
  totalProductos: number;
  porCategoria?: Record<string, number>;
  porEstado?: Record<string, number>;
}

/**
 * Respuesta de conteo para una categoría concreta (incluye sus subcategorías).
 */
export interface CategoryStatsResponseDTO {
  categoryId: number;
  cantidad: number;
}

/** Parámetros de consulta para el top de productos favoritos. */
export interface TopFavoritesQueryDTO {
  limit?: number;
}

/** Entrada del top de favoritos: producto y su número de favoritos. */
export interface TopFavoriteProductDTO {
  productId: string;
  name: string;
  favoritesCount: number;
}
