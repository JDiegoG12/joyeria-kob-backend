import { Category } from '@prisma/client';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  type CreateCategoryInput,
  type CategoryWithRelations,
} from '../services/category.service';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

type FacadeResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

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

export const getAllCategoriesFacade = async (): Promise<
  FacadeResult<CategoryWithRelations[]>
> => {
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
};

export const getCategoryByIdFacade = async (
  id: number,
): Promise<FacadeResult<CategoryWithRelations>> => {
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
};

export const createCategoryFacade = async (
  data: CreateCategoryInput,
): Promise<FacadeResult<Category>> => {
  const { name, slug, description, parentId } = data;

  const parsedParentId =
    parentId !== undefined && parentId !== null ? Number(parentId) : undefined;

  if (parsedParentId !== undefined && Number.isNaN(parsedParentId)) {
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
  if (parsedParentId !== undefined) {
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
    } catch {
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al validar la categoría padre.',
        status: 500,
      };
    }
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
    const isPrismaClientError = (
      err: unknown,
    ): err is { code: string; meta?: { target?: string[] | string } } => {
      return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code?: unknown }).code === 'string'
      );
    };

    if (isPrismaClientError(error) && error.code === 'P2002') {
      const target = error.meta?.target;
      const targets =
        typeof target === 'string'
          ? [target]
          : Array.isArray(target)
            ? target
            : [];

      if (targets.includes('slug')) {
        return {
          success: false,
          error: ERROR_CODES.SLUG_ALREADY_EXISTS,
          message: 'El slug proporcionado ya existe. Por favor, elige otro.',
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
};

type UpdateCategoryInputWithString = {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: number | string | null;
};

export const updateCategoryFacade = async (
  id: number,
  data: UpdateCategoryInputWithString,
): Promise<FacadeResult<CategoryWithRelations>> => {
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

  if (hasParentId && parsedParentId !== null && Number.isNaN(parsedParentId)) {
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
    const isPrismaClientError = (
      err: unknown,
    ): err is { code: string; meta?: { target?: string[] | string } } => {
      return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code?: unknown }).code === 'string'
      );
    };

    if (isPrismaClientError(error)) {
      const target = error.meta?.target;
      const targets =
        typeof target === 'string'
          ? [target]
          : Array.isArray(target)
            ? target
            : [];

      if (error.code === 'P2002' && targets.includes('slug')) {
        return {
          success: false,
          error: ERROR_CODES.SLUG_ALREADY_EXISTS,
          message: 'El slug proporcionado ya existe. Por favor, elige otro.',
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
};

export const deleteCategoryFacade = async (
  id: number,
): Promise<FacadeResult<{ message: string }>> => {
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

    const isPrismaClientError = (err: unknown): err is { code: string } => {
      return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code?: unknown }).code === 'string'
      );
    };

    if (isPrismaClientError(error) && error.code === 'P2003') {
      return {
        success: false,
        error: ERROR_CODES.CATEGORY_HAS_PRODUCTS,
        message:
          'No se puede eliminar la categoría porque tiene productos asociados.',
        status: 400,
      };
    }

    if (isPrismaClientError(error) && error.code === 'P2025') {
      return {
        success: false,
        error: ERROR_CODES.CATEGORY_NOT_FOUND,
        message: 'La categoría solicitada no existe en el catálogo.',
        status: 404,
      };
    }

    return {
      success: false,
      error: ERROR_CODES.INTERNAL_ERROR,
      message: 'Error al eliminar la categoría',
      status: 500,
    };
  }
};
