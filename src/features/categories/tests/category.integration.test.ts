import request from 'supertest';
import app from '../../../api/app'; // Importamos la app de Express
import { prisma } from '../../../config/prisma';

describe('Categories API - Integration Tests', () => {
  // Antes de que todas las pruebas comiencen, limpiamos la tabla de categorías
  beforeAll(async () => {
    // Para evitar errores de Foreign Key, desactivamos temporalmente la restricción,
    // truncamos la tabla (que es más rápido que deleteMany) y la reactivamos.
    // Esto asegura un estado 100% limpio antes de cada ejecución de la suite de tests.
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE `categories`;');
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  });

  // Después de que todas las pruebas terminen, nos desconectamos de la DB
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/categories', () => {
    it('should create a new root category and return 201', async () => {
      const newCategory = {
        name: 'Anillos',
        slug: 'anillos',
        description: 'Categoría de anillos de oro y plata.',
      };

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory);

      // Verificamos que la respuesta HTTP sea la correcta
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Verificamos que los datos devueltos sean correctos
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(newCategory.name);
      expect(response.body.data.slug).toBe(newCategory.slug);
      expect(response.body.data.parentId).toBeNull();
    });

    it('should create a sub-category and return 201', async () => {
      // Primero, obtenemos la categoría padre que acabamos de crear
      const parentCategory = await prisma.category.findUnique({
        where: { slug: 'anillos' },
      });

      const newSubCategory = {
        name: 'Anillos de Compromiso',
        slug: 'anillos-compromiso',
        description: 'Anillos para propuestas de matrimonio.',
        parentId: parentCategory!.id, // Usamos el ID del padre
      };

      const response = await request(app)
        .post('/api/categories')
        .send(newSubCategory);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newSubCategory.name);
      expect(response.body.data.parentId).toBe(parentCategory!.id);
    });

    it('should return 409 if slug already exists', async () => {
      const duplicatedCategory = {
        name: 'Anillos Duplicados',
        slug: 'anillos', // Slug que ya existe
        description: 'Intento de duplicado.',
      };

      const response = await request(app)
        .post('/api/categories')
        .send(duplicatedCategory);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('SLUG_ALREADY_EXISTS');
    });
  });

  describe('GET /api/categories', () => {
    it('should return a list of all categories', async () => {
      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      // En las pruebas POST, creamos 2 categorías.
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return a single category by its ID', async () => {
      const category = await prisma.category.findUnique({
        where: { slug: 'anillos' },
      });
      const response = await request(app).get(
        `/api/categories/${category!.id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(category!.id);
      expect(response.body.data.name).toBe('Anillos');
    });

    it('should return 404 for a non-existent category ID', async () => {
      const response = await request(app).get('/api/categories/99999');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('GET /api/categories/:id/children', () => {
    it('should return the direct children of a category', async () => {
      const parentCategory = await prisma.category.findUnique({
        where: { slug: 'anillos' },
      });
      const response = await request(app).get(
        `/api/categories/${parentCategory!.id}/children`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Anillos de Compromiso');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a category and return 200', async () => {
      const categoryToUpdate = await prisma.category.findUnique({
        where: { slug: 'anillos-compromiso' },
      });

      const updatePayload = {
        name: 'Anillos de Matrimonio',
        description: 'Anillos preciosos para bodas.',
      };

      const response = await request(app)
        .put(`/api/categories/${categoryToUpdate!.id}`)
        .send(updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatePayload.name);
      expect(response.body.data.description).toBe(updatePayload.description);
    });

    it('should return 404 when trying to update a non-existent category', async () => {
      const response = await request(app)
        .put('/api/categories/99999')
        .send({ name: 'No existo' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should return 400 when trying to delete a category that has children', async () => {
      // Arrange: Obtenemos la categoría padre 'Anillos' que sabemos que tiene un hijo
      const parentCategory = await prisma.category.findUnique({
        where: { slug: 'anillos' },
      });

      // Act: Intentamos eliminar la categoría padre
      const response = await request(app).delete(
        `/api/categories/${parentCategory!.id}`,
      );

      // Assert: Verificamos que la API lo impida correctamente
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('CATEGORY_HAS_CHILDREN');
    });

    it('should successfully delete a category with no children', async () => {
      // Arrange: Obtenemos la categoría hija, que no tiene hijos
      const childCategory = await prisma.category.findUnique({
        where: { slug: 'anillos-compromiso' },
      });

      // Act: La eliminamos
      const response = await request(app).delete(
        `/api/categories/${childCategory!.id}`,
      );

      // Assert: Verificamos que se haya eliminado correctamente
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
