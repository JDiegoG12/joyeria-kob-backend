import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  findCategoryByNameAndParent,
  getCategoryChildren,
  CreateCategoryInput,
  isPrismaClientKnownRequestError,
} from '../services/category.service';
import { prisma } from '../../../config/prisma';
import { Prisma } from '@prisma/client';

// Mockea todo el cliente de Prisma para el módulo de Categorías para aislar las pruebas del servicio de las operaciones reales de la base de datos.
jest.mock('../../../config/prisma', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

// Convierte prisma.category a un objeto mockeado para una mejor inferencia de tipos, permitiendo el uso de las funciones de mock de Jest.
const mockedPrismaCategory = prisma.category as jest.Mocked<
  typeof prisma.category
>;

describe('Category Service', () => {
  // Limpia todas las llamadas a mocks y resetea las implementaciones de mocks después de cada prueba para asegurar el aislamiento de las pruebas.
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Suite de pruebas para la función `getAllCategories`.
  describe('getAllCategories', () => {
    // Caso de prueba: debe recuperar y devolver correctamente todas las categorías.
    it('should return all categories', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Category 1',
          slug: 'category-1',
          description: null,
          parentId: null,
          createdAt: new Date(),
          children: [],
          parent: null,
        },
        {
          id: 2,
          name: 'Category 2',
          slug: 'category-2',
          description: 'Desc 2',
          parentId: null,
          createdAt: new Date(),
          children: [],
          parent: null,
        },
      ];
      // Mockea el método `findMany` de Prisma para que devuelva una lista predefinida de categorías.
      mockedPrismaCategory.findMany.mockResolvedValue(mockCategories);

      const result = await getAllCategories();
      // Asegura que el resultado devuelto coincide con las categorías mockeadas.
      expect(result).toEqual(mockCategories);
      // Asegura que `findMany` fue llamado con los parámetros de ordenación e inclusión correctos.
      expect(mockedPrismaCategory.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        include: {
          parent: true,
          children: true,
        },
      });
    });

    // Caso de prueba: debe devolver un array vacío cuando no hay categorías en la base de datos.
    it('should return an empty array if no categories are found', async () => {
      // Mockea `findMany` para que resuelva con un array vacío.
      mockedPrismaCategory.findMany.mockResolvedValue([]);

      const result = await getAllCategories();
      // Asegura que se devuelve un array vacío.
      expect(result).toEqual([]);
      // Asegura que `findMany` fue llamado exactamente una vez.
      expect(mockedPrismaCategory.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // Suite de pruebas para la función `getCategoryById`.
  describe('getCategoryById', () => {
    // Caso de prueba: debe recuperar correctamente una categoría por su ID si existe.
    it('should return a category if found', async () => {
      const mockCategory = {
        id: 1,
        name: 'Category 1',
        slug: 'category-1',
        description: null,
        parentId: null,
        createdAt: new Date(),
        children: [],
        parent: null,
      };
      // Mockea `findUnique` para que devuelva una categoría específica.
      mockedPrismaCategory.findUnique.mockResolvedValue(mockCategory);

      const result = await getCategoryById(1);
      // Asegura que se devuelve la categoría correcta.
      expect(result).toEqual(mockCategory);
      // Asegura que `findUnique` fue llamado con el ID y los parámetros de inclusión correctos.
      expect(mockedPrismaCategory.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { parent: true, children: true },
      });
    });

    // Caso de prueba: debe devolver nulo si no se encuentra una categoría con el ID especificado.
    it('should return null if category is not found', async () => {
      // Mockea `findUnique` para que devuelva nulo, simulando que no se encontró la categoría.
      mockedPrismaCategory.findUnique.mockResolvedValue(null);

      const result = await getCategoryById(999);
      // Asegura que se devuelve nulo.
      expect(result).toBeNull();
      // Asegura que `findUnique` fue llamado exactamente una vez.
      expect(mockedPrismaCategory.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  // Suite de pruebas para la función `createCategory`.
  describe('createCategory', () => {
    // Caso de prueba: debe crear y devolver correctamente la nueva categoría.
    it('should create and return the new category', async () => {
      const newCategoryData: CreateCategoryInput = {
        name: 'New Category',
        slug: 'new-category',
        description: 'New Description',
        parentId: null,
      };
      const createdCategory = {
        id: 3,
        ...newCategoryData,
        description: newCategoryData.description ?? null,
        parentId: newCategoryData.parentId ?? null,
        createdAt: new Date(),
      };
      // Mockea `create` para que devuelva la categoría recién creada con un ID y fecha de creación asignados.
      mockedPrismaCategory.create.mockResolvedValue(createdCategory);

      const result = await createCategory(newCategoryData);
      // Asegura que la categoría devuelta coincide con la categoría creada esperada.
      expect(result).toEqual(createdCategory);
      // Asegura que `create` fue llamado con los datos correctos.
      expect(mockedPrismaCategory.create).toHaveBeenCalledWith({
        data: newCategoryData,
      });
    });
  });

  // Suite de pruebas para la función `updateCategory`.
  describe('updateCategory', () => {
    // Caso de prueba: debe actualizar correctamente una categoría existente y devolver los datos actualizados.
    it('should update and return the updated category', async () => {
      const updatedCategoryData = {
        name: 'Updated Name',
        slug: 'updated-name',
        description: 'Updated Description',
      };
      const updatedCategory = {
        id: 1,
        name: 'Updated Name',
        slug: 'updated-name',
        description: 'Updated Description',
        parentId: null,
        createdAt: new Date(),
        children: [],
        parent: null,
      };
      // Mockea `update` para que devuelva la categoría con los nuevos datos.
      mockedPrismaCategory.update.mockResolvedValue(updatedCategory);

      const result = await updateCategory(1, updatedCategoryData);
      // Asegura que la categoría devuelta refleja las actualizaciones.
      expect(result).toEqual(updatedCategory);
      // Asegura que `update` fue llamado con el ID, los datos y los parámetros de inclusión correctos.
      expect(mockedPrismaCategory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updatedCategoryData,
        include: { parent: true, children: true },
      });
    });

    // Caso de prueba: debe lanzar un error de Prisma 'P2025' si la categoría a actualizar no existe.
    it('should throw an error if category to update is not found (P2025)', async () => {
      // Crea un error mock de Prisma para un registro no encontrado.
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record to update not found.',
        { code: 'P2025', clientVersion: '4.15.0' },
      );
      // Mockea `update` para que rechace con el error de Prisma.
      mockedPrismaCategory.update.mockRejectedValue(prismaError);

      // Asegura que llamar a `updateCategory` con un ID no existente lanza el error específico de Prisma.
      await expect(
        updateCategory(999, { name: 'Non Existent' }),
      ).rejects.toThrow(prismaError);
    });
  });

  // Suite de pruebas para la función `deleteCategory`.
  describe('deleteCategory', () => {
    // Caso de prueba: debe eliminar correctamente una categoría que no tiene hijos.
    it('should return true if category is deleted successfully', async () => {
      // Mockea `findFirst` para que devuelva nulo, indicando que no hay hijos.
      mockedPrismaCategory.findFirst.mockResolvedValue(null);
      // Mockea `delete` para que devuelva una categoría eliminada.
      mockedPrismaCategory.delete.mockResolvedValue({
        id: 1,
        name: 'Category',
        slug: 'category',
        description: null,
        parentId: null,
        createdAt: new Date(),
      });

      const result = await deleteCategory(1);
      // Asegura que la eliminación fue exitosa.
      expect(result).toBe(true);
      // Asegura que `findFirst` fue llamado para verificar si hay hijos.
      expect(mockedPrismaCategory.findFirst).toHaveBeenCalledWith({
        where: { parentId: 1 },
      });
      // Asegura que `delete` fue llamado con el ID correcto.
      expect(mockedPrismaCategory.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    // Caso de prueba: debe lanzar un error 'CATEGORY_HAS_CHILDREN' si se intenta eliminar una categoría con subcategorías.
    it('should throw an error if category has children', async () => {
      // Mockea `findFirst` para que devuelva una categoría hija, indicando que existen hijos.
      mockedPrismaCategory.findFirst.mockResolvedValue({
        id: 2,
        name: 'Child',
        slug: 'child',
        description: null,
        parentId: 1,
        createdAt: new Date(),
      });

      // Asegura que llamar a `deleteCategory` lanza el error 'CATEGORY_HAS_CHILDREN'.
      await expect(deleteCategory(1)).rejects.toThrow('CATEGORY_HAS_CHILDREN');
      // Asegura que `findFirst` fue llamado para verificar si hay hijos.
      expect(mockedPrismaCategory.findFirst).toHaveBeenCalledWith({
        where: { parentId: 1 },
      });
      // Asegura que `delete` no fue llamado, ya que la eliminación debe prevenirse.
      expect(mockedPrismaCategory.delete).not.toHaveBeenCalled();
    });

    // Caso de prueba: debe devolver falso si la categoría a eliminar no se encuentra (error de Prisma 'P2025').
    it('should return false if category to delete is not found (P2025)', async () => {
      // Mockea `findFirst` para que devuelva nulo (sin hijos) y `delete` para que rechace con un error 'P2025'.
      mockedPrismaCategory.findFirst.mockResolvedValue(null);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record to delete not found.',
        { code: 'P2025', clientVersion: '4.15.0' },
      );
      mockedPrismaCategory.delete.mockRejectedValue(prismaError);

      const result = await deleteCategory(999);
      // Asegura que se devuelve falso, indicando que no hubo eliminación.
      expect(result).toBe(false);
    });

    // Caso de prueba: debe relanzar cualquier otro error inesperado de Prisma encontrado durante la eliminación.
    it('should rethrow other Prisma errors during deletion', async () => {
      // Mockea `findFirst` para que devuelva nulo (sin hijos) y `delete` para que rechace con un error genérico de Prisma.
      mockedPrismaCategory.findFirst.mockResolvedValue(null);
      const otherPrismaError = new Prisma.PrismaClientKnownRequestError(
        'Some other error',
        { code: 'P9999', clientVersion: '4.15.0' },
      );
      mockedPrismaCategory.delete.mockRejectedValue(otherPrismaError);

      // Asegura que `deleteCategory` relanza el error genérico de Prisma.
      await expect(deleteCategory(1)).rejects.toThrow(otherPrismaError);
    });
  });

  // Suite de pruebas para la función `findCategoryByNameAndParent`.
  describe('findCategoryByNameAndParent', () => {
    // Caso de prueba: debe devolver una categoría si se encuentra por su nombre y ID de padre.
    it('should return a category if found by name and parentId', async () => {
      const mockCategory = {
        id: 1,
        name: 'Unique Name',
        slug: 'unique-name',
        description: null,
        parentId: 10,
        createdAt: new Date(),
      };
      // Mockea `findFirst` para que devuelva una categoría que coincida con los criterios.
      mockedPrismaCategory.findFirst.mockResolvedValue(mockCategory);

      const result = await findCategoryByNameAndParent('Unique Name', 10);
      // Asegura que se devuelve la categoría correcta.
      expect(result).toEqual(mockCategory);
      // Asegura que `findFirst` fue llamado con el nombre y el ID de padre correctos.
      expect(mockedPrismaCategory.findFirst).toHaveBeenCalledWith({
        where: { name: 'Unique Name', parentId: 10 },
      });
    });

    // Caso de prueba: debe devolver nulo si no se encuentra ninguna categoría que coincida con el nombre y el ID de padre.
    it('should return null if category not found by name and parentId', async () => {
      // Mockea `findFirst` para que devuelva nulo.
      mockedPrismaCategory.findFirst.mockResolvedValue(null);

      const result = await findCategoryByNameAndParent('Non Existent', null);
      // Asegura que se devuelve nulo.
      expect(result).toBeNull();
      // Asegura que `findFirst` fue llamado exactamente una vez.
      expect(mockedPrismaCategory.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  // Suite de pruebas para la función `getCategoryChildren`.
  describe('getCategoryChildren', () => {
    // Caso de prueba: debe devolver todas las categorías hijas directas de una categoría padre especificada.
    it('should return direct children of a parent category', async () => {
      const mockChildren = [
        {
          id: 101,
          name: 'Child 1',
          slug: 'child-1',
          description: null,
          parentId: 1,
          createdAt: new Date(),
          children: [],
          parent: null,
        },
      ];
      // Mockea `findMany` para que devuelva una lista de categorías hijas.
      mockedPrismaCategory.findMany.mockResolvedValue(mockChildren);

      const result = await getCategoryChildren(1);
      // Asegura que se devuelve la lista correcta de hijos.
      expect(result).toEqual(mockChildren);
      // Asegura que `findMany` fue llamado con el ID de padre, la ordenación y los parámetros de inclusión correctos.
      expect(mockedPrismaCategory.findMany).toHaveBeenCalledWith({
        where: { parentId: 1 },
        orderBy: { name: 'asc' },
        include: {
          parent: true,
          children: true,
        },
      });
    });

    // Caso de prueba: debe devolver un array vacío si la categoría padre especificada no tiene hijos directos.
    it('should return an empty array if no direct children are found', async () => {
      // Mockea `findMany` para que devuelva un array vacío.
      mockedPrismaCategory.findMany.mockResolvedValue([]);

      const result = await getCategoryChildren(999);
      // Asegura que se devuelve un array vacío.
      expect(result).toEqual([]);
      // Asegura que `findMany` fue llamado exactamente una vez.
      expect(mockedPrismaCategory.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // Suite de pruebas para la función auxiliar `isPrismaClientKnownRequestError`.
  describe('isPrismaClientKnownRequestError', () => {
    // Caso de prueba: debe identificar correctamente un PrismaClientKnownRequestError válido.
    it('should return true for a valid PrismaClientKnownRequestError', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Test error',
        { code: 'P2002', clientVersion: '2.26.2' },
      );
      // Asegura que la función auxiliar devuelve verdadero para una instancia de error de Prisma.
      expect(isPrismaClientKnownRequestError(prismaError)).toBe(true);
    });

    // Caso de prueba: debe devolver falso para un objeto Error genérico.
    it('should return false for a generic error', () => {
      const genericError = new Error('Generic error');
      // Asegura que la función auxiliar devuelve falso para un error que no es de Prisma.
      expect(isPrismaClientKnownRequestError(genericError)).toBe(false);
    });

    // Caso de prueba: debe devolver falso para un valor nulo.
    it('should return false for a null value', () => {
      // Asegura que la función auxiliar devuelve falso para nulo.
      expect(isPrismaClientKnownRequestError(null)).toBe(false);
    });

    // Caso de prueba: debe devolver falso para un objeto que no tiene la propiedad 'code', característica de los errores de Prisma.
    it('should return false for an object without a code property', () => {
      const obj = { message: 'Missing code' };
      // Asegura que la función auxiliar devuelve falso para un objeto que no se ajusta a la estructura de error de Prisma.
      expect(isPrismaClientKnownRequestError(obj)).toBe(false);
    });
  });
});
