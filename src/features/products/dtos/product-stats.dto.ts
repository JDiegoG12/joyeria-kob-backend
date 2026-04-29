import { ProductStatus } from '@prisma/client';

export interface StatsQueryDTO {
  agrupar?: 'categoria' | 'estado';
  estado?: ProductStatus;
  categoryId?: number;
}

export interface StatsResponseDTO {
  totalProductos: number;
  porCategoria?: Record<string, number>;
  porEstado?: Record<string, number>;
}

export interface CategoryStatsResponseDTO {
  categoryId: number;
  cantidad: number;
}
