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
  getAllCategories(): Promise<FacadeResult<CategoryWithRelations[]>>;
  getCategoryById(id: number): Promise<FacadeResult<CategoryWithRelations>>;
  getCategoryChildren(
    id: number,
  ): Promise<FacadeResult<CategoryWithRelations[]>>;
  createCategory(data: CreateCategoryDto): Promise<FacadeResult<Category>>;
  updateCategory(
    id: number,
    data: UpdateCategoryDto,
  ): Promise<FacadeResult<CategoryWithRelations>>;
  deleteCategory(id: number): Promise<FacadeResult<{ message: string }>>;
}
