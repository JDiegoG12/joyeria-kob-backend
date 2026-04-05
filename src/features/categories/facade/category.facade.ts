import { Category, Prisma } from '@prisma/client';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  type CreateCategoryInput,
  type CategoryWithRelations,
  findCategoryByNameAndParent,
  getCategoryChildren,
} from '../services/category.service';
import { ICategoryFacade, FacadeResult } from '../ports/category.ports';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

/**
 * Verifica si asignar un parentId crearía una referencia cíclica en la jerarquía.
 * @param categoryId - ID de la categoría que se está actualizando.
 * @param potentialParentId - ID del potencial padre.
 * @returns true si hay ciclo, false en caso contrario.
 */
const hasCyclicReference = async (
  categoryId: number,
  potentialParentId: number,
): Promise<boolean> => {
  let currentId: number | null = potentialParentId;
  while (currentId !== null) {
    if (currentId === categoryId) return true;
    const parent = await getCategoryById(currentId);
    currentId = parent?.parentId ?? null;
  }
  return false;
};

type UpdateCategoryInputWithString = {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: number | string | null;
};

/**
 * Implementación concreta de la lógica de negocio para categorías.
 * Cumple con el contrato definido en ICategoryFacade.
 */
class CategoryFacade implements ICategoryFacade {
  async getAllCategories(): Promise<FacadeResult<CategoryWithRelations[]>> {
    try {
      const categories = await getAllCategories();
      return {
        success: true,
        data: categories,
        status: 200,
      };
    } catch (error) {
      console.error('Error in getAllCategoriesFacade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener las categorías',
        status: 500,
      };
    }
  }

  async getCategoryById(
    id: number,
  ): Promise<FacadeResult<CategoryWithRelations>> {
    if (Number.isNaN(id)) {
      return {
        success: false,
        error: ERROR_CODES.INVALID_ID,
        message: 'El ID suministrado no es válido.',
        status: 400,
      };
    }

    try {
      const category = await getCategoryById(id);
      if (!category) {
        return {
          success: false,
          error: ERROR_CODES.CATEGORY_NOT_FOUND,
          message: 'La categoría solicitada no existe en el catálogo.',
          status: 404,
        };
      }
      return {
        success: true,
        data: category,
        status: 200,
      };
    } catch {
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener la categoría',
        status: 500,
      };
    }
  }

  async getCategoryChildren(
    id: number,
  ): Promise<FacadeResult<CategoryWithRelations[]>> {
    if (Number.isNaN(id)) {
      return {
        success: false,
        error: ERROR_CODES.INVALID_ID,
        message: 'El ID suministrado no es válido.',
        status: 400,
      };
    }

    try {
      // Primero, verificamos que la categoría padre exista.
      const parentCategory = await getCategoryById(id);
      if (!parentCategory) {
        return {
          success: false,
          error: ERROR_CODES.CATEGORY_NOT_FOUND,
          message: 'La categoría padre solicitada no existe.',
          status: 404,
        };
      }

      const children = await getCategoryChildren(id);
      return {
        success: true,
        data: children,
        status: 200,
      };
    } catch (error) {
      console.error('Error in getCategoryChildren:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener las subcategorías.',
        status: 500,
      };
    }
  }

  async createCategory(
    data: CreateCategoryInput,
  ): Promise<FacadeResult<Category>> {
    const { name, slug, description, parentId } = data;

    let parsedParentId: number | null | undefined;
    if (parentId === null) {
      parsedParentId = null; // Es una categoría raíz explícitamente
    } else if (parentId !== undefined) {
      parsedParentId = Number(parentId); // Es una subcategoría
    } else {
      parsedParentId = null; // Si no se envía, se asume que es raíz
    }

    if (parsedParentId !== null && Number.isNaN(parsedParentId)) {
      return {
        success: false,
        error: ERROR_CODES.INVALID_PARENT_ID,
        message: 'El parentId suministrado no es válido.',
        status: 400,
      };
    }

    if (!name || !slug) {
      return {
        success: false,
        error: ERROR_CODES.MISSING_FIELDS,
        message: 'Los campos name y slug son obligatorios.',
        status: 400,
      };
    }

    // Validar jerarquía: verificar que la categoría padre exista
    if (typeof parsedParentId === 'number') {
      const parentResult = await this.getCategoryById(parsedParentId);
      if (!parentResult.success) {
        return {
          ...parentResult,
          message: 'La categoría padre especificada no existe o es inválida.',
        };
      }
    }

    // Validar unicidad de nombre (case-insensitive) bajo el mismo padre
    const existingCategoryWithName = await findCategoryByNameAndParent(
      name,
      parsedParentId,
    );
    if (existingCategoryWithName) {
      return {
        success: false,
        error: ERROR_CODES.NAME_ALREADY_EXISTS,
        message: `El nombre de categoría '${name}' ya existe en este nivel.`,
        status: 409,
      };
    }

    try {
      const newCategory = await createCategory({
        name,
        slug,
        description,
        parentId: parsedParentId,
      });
      return {
        success: true,
        data: newCategory,
        status: 201,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target as string[];

        if (target.includes('slug')) {
          return {
            success: false,
            error: ERROR_CODES.SLUG_ALREADY_EXISTS,
            message: 'El slug proporcionado ya existe. Por favor, elige otro.',
            status: 409,
          };
        }
        if (target.includes('name')) {
          return {
            success: false,
            error: ERROR_CODES.NAME_ALREADY_EXISTS,
            message: `El nombre de categoría '${name}' ya existe.`,
            status: 409,
          };
        }
      }
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al crear la categoría',
        status: 500,
      };
    }
  }

  async updateCategory(
    id: number,
    data: UpdateCategoryInputWithString,
  ): Promise<FacadeResult<CategoryWithRelations>> {
    if (Number.isNaN(id)) {
      return {
        success: false,
        error: ERROR_CODES.INVALID_ID,
        message: 'El ID suministrado no es válido.',
        status: 400,
      };
    }

    const { name, slug, description, parentId } = data;

    const hasParentId = parentId !== undefined;
    const parsedParentId =
      parentId === null
        ? null
        : parentId !== undefined
          ? Number(parentId)
          : undefined;

    if (
      hasParentId &&
      parsedParentId !== null &&
      Number.isNaN(parsedParentId)
    ) {
      return {
        success: false,
        error: ERROR_CODES.INVALID_PARENT_ID,
        message: 'El parentId suministrado no es válido.',
        status: 400,
      };
    }

    if (parsedParentId === id) {
      return {
        success: false,
        error: ERROR_CODES.INVALID_PARENT_ID,
        message:
          'No se puede asignar la categoría como su propia categoría padre.',
        status: 400,
      };
    }

    if (name === '') {
      return {
        success: false,
        error: ERROR_CODES.MISSING_FIELDS,
        message: 'El nombre de la categoría no puede ser vacío.',
        status: 400,
      };
    }

    // Validar unicidad de nombre (case-insensitive) si se está cambiando
    if (name) {
      // Para la actualización, el parentId a verificar es el que viene en `data`
      // o, si no viene, el actual de la categoría que se está editando.
      // Esta lógica es más compleja, por ahora simplificamos:
      const targetParentId =
        parentId === undefined
          ? (await getCategoryById(id))?.parentId
          : parsedParentId;

      const existingCategoryWithName = await findCategoryByNameAndParent(
        name,
        targetParentId,
      );
      // Si existe una categoría con ese nombre y no es la que estamos actualizando
      if (existingCategoryWithName && existingCategoryWithName.id !== id) {
        return {
          success: false,
          error: ERROR_CODES.NAME_ALREADY_EXISTS,
          message: `El nombre de categoría '${name}' ya está en uso por otra categoría.`,
          status: 409,
        };
      }
    }

    const updateData: Partial<CreateCategoryInput> = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (hasParentId) updateData.parentId = parsedParentId;

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: ERROR_CODES.MISSING_FIELDS,
        message: 'Debe enviar al menos un campo para actualizar.',
        status: 400,
      };
    }

    // Validar jerarquía: verificar que la categoría padre exista y no cree ciclos
    if (parsedParentId !== null && parsedParentId !== undefined) {
      try {
        const parentCategory = await getCategoryById(parsedParentId);
        if (!parentCategory) {
          return {
            success: false,
            error: ERROR_CODES.CATEGORY_NOT_FOUND,
            message: 'La categoría padre especificada no existe.',
            status: 404,
          };
        }

        // Verificar referencia cíclica
        const hasCycle = await hasCyclicReference(id, parsedParentId);
        if (hasCycle) {
          return {
            success: false,
            error: ERROR_CODES.CYCLIC_REFERENCE,
            message:
              'No se puede asignar esta categoría padre porque crearía una referencia cíclica.',
            status: 400,
          };
        }
      } catch {
        return {
          success: false,
          error: ERROR_CODES.INTERNAL_ERROR,
          message: 'Error al validar la jerarquía de categorías.',
          status: 500,
        };
      }
    }

    try {
      const updatedCategory = await updateCategory(id, updateData);
      return {
        success: true,
        data: updatedCategory,
        status: 200,
      };
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const target = error.meta?.target as string[];

        if (error.code === 'P2002' && target.includes('slug')) {
          return {
            success: false,
            error: ERROR_CODES.SLUG_ALREADY_EXISTS,
            message: 'El slug proporcionado ya existe. Por favor, elige otro.',
            status: 409,
          };
        }

        if (error.code === 'P2002' && target.includes('name')) {
          return {
            success: false,
            error: ERROR_CODES.NAME_ALREADY_EXISTS,
            message: `El nombre de categoría '${name}' ya está en uso.`,
            status: 409,
          };
        }

        if (error.code === 'P2025') {
          return {
            success: false,
            error: ERROR_CODES.CATEGORY_NOT_FOUND,
            message: 'La categoría solicitada no existe en el catálogo.',
            status: 404,
          };
        }
      }

      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al actualizar la categoría',
        status: 500,
      };
    }
  }

  async deleteCategory(id: number): Promise<FacadeResult<{ message: string }>> {
    if (Number.isNaN(id)) {
      return {
        success: false,
        error: ERROR_CODES.INVALID_ID,
        message: 'El ID suministrado no es válido.',
        status: 400,
      };
    }

    try {
      const deleted = await deleteCategory(id);
      if (!deleted) {
        return {
          success: false,
          error: ERROR_CODES.CATEGORY_NOT_FOUND,
          message: 'La categoría solicitada no existe en el catálogo.',
          status: 404,
        };
      }
      return {
        success: true,
        data: { message: 'Categoría eliminada exitosamente.' },
        status: 200,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'CATEGORY_HAS_CHILDREN') {
        return {
          success: false,
          error: ERROR_CODES.CATEGORY_HAS_CHILDREN,
          message:
            'No se puede eliminar la categoría porque tiene subcategorías asociadas.',
          status: 400,
        };
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          return {
            success: false,
            error: ERROR_CODES.CATEGORY_HAS_PRODUCTS,
            message:
              'No se puede eliminar la categoría porque tiene productos asociados.',
            status: 400,
          };
        }

        if (error.code === 'P2025') {
          return {
            success: false,
            error: ERROR_CODES.CATEGORY_NOT_FOUND,
            message: 'La categoría solicitada no existe en el catálogo.',
            status: 404,
          };
        }
      }

      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al eliminar la categoría',
        status: 500,
      };
    }
  }
}

export const categoryFacade = new CategoryFacade();
