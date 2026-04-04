import { PrismaClient, Category, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

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

const isPrismaClientKnownRequestError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  );
};

export const getAllCategories = async (): Promise<CategoryWithRelations[]> => {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      parent: true,
      children: true,
    },
  });
};

export const getCategoryById = async (
  id: number,
): Promise<CategoryWithRelations | null> => {
  return await prisma.category.findUnique({
    where: { id },
    include: { parent: true, children: true },
  });
};

export const createCategory = async (
  data: CreateCategoryInput,
): Promise<Category> => {
  return await prisma.category.create({
    data,
  });
};

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
