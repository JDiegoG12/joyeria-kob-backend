import { Category, Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';

export type CreateCategoryInput = {
  name: string;
  slug: string;
  description?: string;
  parentId?: number | null;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export type CategoryWithRelations = Category & {
  parent: Category | null;
  children: Category[];
};

/**
 * Guarda de tipo que determina si un error es un `PrismaClientKnownRequestError`.
 * Comprueba de forma estructural la presencia de una propiedad `code` de tipo
 * string, característica de los errores conocidos de Prisma.
 *
 * @param error - Valor a inspeccionar.
 * @returns `true` si el error corresponde a un error conocido de Prisma.
 */
export const isPrismaClientKnownRequestError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  );
};

/**
 * Obtiene todas las categorías ordenadas por nombre, incluyendo su padre y sus
 * hijos directos.
 *
 * @returns Lista de categorías con sus relaciones.
 */
export const getAllCategories = async (): Promise<CategoryWithRelations[]> => {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      parent: true,
      children: true,
    },
  });
};

/**
 * Busca una categoría por su ID, incluyendo su padre y sus hijos directos.
 *
 * @param id - ID de la categoría.
 * @returns La categoría con sus relaciones, o `null` si no existe.
 */
export const getCategoryById = async (
  id: number,
): Promise<CategoryWithRelations | null> => {
  return await prisma.category.findUnique({
    where: { id },
    include: { parent: true, children: true },
  });
};

/**
 * Crea una categoría con los datos ya validados y el slug generado.
 *
 * @param data - Datos de la categoría a crear.
 * @returns La categoría creada.
 */
export const createCategory = async (
  data: CreateCategoryInput,
): Promise<Category> => {
  return await prisma.category.create({
    data,
  });
};

/**
 * Actualiza una categoría existente y devuelve el registro con sus relaciones.
 *
 * @param id - ID de la categoría a actualizar.
 * @param data - Campos a modificar.
 * @returns La categoría actualizada con su padre e hijos.
 */
export const updateCategory = async (
  id: number,
  data: UpdateCategoryInput,
): Promise<CategoryWithRelations> => {
  return await prisma.category.update({
    where: { id },
    data,
    include: { parent: true, children: true },
  });
};

/**
 * Elimina una categoría siempre que no tenga subcategorías.
 *
 * @param id - ID de la categoría a eliminar.
 * @returns `true` si se eliminó; `false` si el registro no existía (`P2025`).
 * @throws `Error('CATEGORY_HAS_CHILDREN')` si la categoría tiene subcategorías,
 *   o cualquier otro error de Prisma no controlado.
 */
export const deleteCategory = async (id: number): Promise<boolean> => {
  const hasChildren = await prisma.category.findFirst({
    where: { parentId: id },
  });

  if (hasChildren) {
    throw new Error('CATEGORY_HAS_CHILDREN');
  }

  try {
    await prisma.category.delete({
      where: { id },
    });
    return true;
  } catch (error: unknown) {
    if (isPrismaClientKnownRequestError(error) && error.code === 'P2025') {
      return false;
    }

    throw error;
  }
};

/**
 * Busca una categoría por nombre y opcionalmente por su padre (case-insensitive).
 * @param name - El nombre de la categoría a buscar.
 * @param parentId - El ID de la categoría padre (null para categorías raíz).
 * @returns La categoría encontrada o null si no existe.
 */
export const findCategoryByNameAndParent = async (
  name: string,
  parentId: number | null | undefined,
): Promise<Category | null> => {
  return prisma.category.findFirst({
    where: {
      name: name,
      parentId: parentId,
    },
  });
};

/**
 * Obtiene solo las subcategorías directas de una categoría padre.
 * @param parentId - El ID de la categoría padre.
 * @returns Un array de las subcategorías directas.
 */
export const getCategoryChildren = async (
  parentId: number,
): Promise<CategoryWithRelations[]> => {
  return await prisma.category.findMany({
    where: { parentId },
    orderBy: { name: 'asc' },
    include: {
      parent: true,
      children: true,
    },
  });
};
