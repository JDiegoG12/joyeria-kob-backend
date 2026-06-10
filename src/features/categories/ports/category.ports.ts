import { Category } from '@prisma/client';
import {
  CategoryWithRelations,
} from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';

/**
 * Define la estructura de la respuesta unificada para los facades.
 */
export type FacadeResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

/**
 * Define el contrato (la interfaz) que cualquier facade de categorías debe implementar.
 * El controlador dependerá de esta abstracción, no de una implementación concreta.
 */
export interface ICategoryFacade {
  /** Obtiene todas las categorías con sus relaciones (padre e hijos). */
  getAllCategories(): Promise<FacadeResult<CategoryWithRelations[]>>;
  /** Obtiene una categoría por su ID. */
  getCategoryById(id: number): Promise<FacadeResult<CategoryWithRelations>>;
  /** Obtiene las subcategorías directas de una categoría padre. */
  getCategoryChildren(
    id: number,
  ): Promise<FacadeResult<CategoryWithRelations[]>>;
  /** Crea una categoría validando jerarquía y unicidad de nombre. */
  createCategory(data: CreateCategoryDto): Promise<FacadeResult<Category>>;
  /** Actualiza una categoría validando jerarquía, ciclos y unicidad. */
  updateCategory(
    id: number,
    data: UpdateCategoryDto,
  ): Promise<FacadeResult<CategoryWithRelations>>;
  /** Elimina una categoría si no tiene subcategorías ni productos asociados. */
  deleteCategory(id: number): Promise<FacadeResult<{ message: string }>>;
}
