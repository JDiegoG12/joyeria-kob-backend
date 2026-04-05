import { categoryFacade } from '../facade/category.facade';
import * as categoryService from '../services/category.service';
import { Prisma } from '@prisma/client';
import { CategoryWithRelations } from '../services/category.service';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

// Mockear el módulo de servicio completo
jest.mock('../services/category.service');

// Tipar el mock para tener autocompletado y seguridad de tipos
const mockedCategoryService = categoryService as jest.Mocked<
  typeof categoryService
>;

describe('CategoryFacade', () => {
  // Limpiar los mocks después de cada prueba para evitar interferencias
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategoryById', () => {
    it('should return an error for an invalid ID (NaN)', async () => {
      // Arrange
      const invalidId = NaN;

      // Act
      const result = await categoryFacade.getCategoryById(invalidId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toBe(ERROR_CODES.INVALID_ID);
    });

    it('should return a category if found', async () => {
      // Arrange
      const category = {
        id: 1,
        name: 'Test',
        slug: 'test',
        parentId: null,
        createdAt: new Date(),
        children: [],
        parent: null,
        description: null,
      };
      mockedCategoryService.getCategoryById.mockResolvedValue(category);

      // Act
      const result = await categoryFacade.getCategoryById(1);

      // Assert
      expect(result.data).toEqual(category);
      expect(result.status).toBe(200);
    });
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      // Arrange: Preparar el escenario de la prueba
      const input = {
        name: 'Nueva Categoría',
        slug: 'nueva-categoria',
        description: 'Descripción de prueba',
        parentId: null,
      };

      // Simular que no existe una categoría con ese nombre
      mockedCategoryService.findCategoryByNameAndParent.mockResolvedValue(null);

      // Simular que la creación en la DB es exitosa
      const createdCategory = {
        id: 1,
        ...input,
        createdAt: new Date(),
        description: 'Descripción de prueba',
      };
      mockedCategoryService.createCategory.mockResolvedValue(createdCategory);

      // Act: Ejecutar la función que queremos probar
      const result = await categoryFacade.createCategory(input);

      // Assert: Verificar que el resultado es el esperado
      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data).toEqual(createdCategory);
      expect(
        mockedCategoryService.findCategoryByNameAndParent,
      ).toHaveBeenCalledWith(input.name, input.parentId);
      expect(mockedCategoryService.createCategory).toHaveBeenCalledWith(input);
    });

    it('should return an error if the category name already exists at the same level', async () => {
      // Arrange
      const input = {
        name: 'Categoría Existente',
        slug: 'categoria-existente',
        parentId: 1,
      };

      // Simular que ya existe una categoría con ese nombre y parentId
      const existingCategory = {
        id: 2,
        ...input,
        createdAt: new Date(),
        description: null,
      };
      mockedCategoryService.findCategoryByNameAndParent.mockResolvedValue(
        existingCategory,
      );
      // Añadimos el mock para la validación del padre que ahora se ejecuta
      mockedCategoryService.getCategoryById.mockResolvedValue({
        id: 1,
      } as any);

      // Act
      const result = await categoryFacade.createCategory(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(409);
      expect(result.error).toBe(ERROR_CODES.NAME_ALREADY_EXISTS);
      expect(mockedCategoryService.createCategory).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should return an error if no fields are provided for update', async () => {
      // Arrange
      const categoryId = 1;
      const emptyPayload = {};

      // Act
      const result = await categoryFacade.updateCategory(
        categoryId,
        emptyPayload,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toBe(ERROR_CODES.MISSING_FIELDS);
    });

    it('should return an error when trying to set a category as its own parent', async () => {
      // Arrange
      const categoryId = 1;
      const payload = { parentId: categoryId };

      // Act
      const result = await categoryFacade.updateCategory(categoryId, payload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toBe(ERROR_CODES.INVALID_PARENT_ID);
      expect(result.message).toContain('su propia categoría padre');
    });

    it('should return an error for cyclic reference', async () => {
      // Arrange: Cat 1 -> Cat 2 -> Cat 3. Intentamos hacer Cat 1 hijo de Cat 3.
      const categoryId = 1;
      const payload = { parentId: 3 };

      // Mockeamos la jerarquía para que hasCyclicReference la recorra
      mockedCategoryService.getCategoryById.mockImplementation(async (id) => {
        if (id === 3) {
          return { id: 3, parentId: 2 } as unknown as CategoryWithRelations;
        }
        if (id === 2) {
          return { id: 2, parentId: 1 } as unknown as CategoryWithRelations;
        }
        return null;
      });

      // Act
      const result = await categoryFacade.updateCategory(categoryId, payload);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toBe(ERROR_CODES.CYCLIC_REFERENCE);
    });
  });

  describe('deleteCategory', () => {
    it('should return an error if the category has associated products (Prisma P2003)', async () => {
      // Arrange
      const categoryId = 1;
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '4.15.0' },
      );
      mockedCategoryService.deleteCategory.mockRejectedValue(prismaError);

      // Act
      const result = await categoryFacade.deleteCategory(categoryId);

      // Assert
      expect(result.error).toBe(ERROR_CODES.CATEGORY_HAS_PRODUCTS);
      expect(result.status).toBe(400);
    });
  });
});
