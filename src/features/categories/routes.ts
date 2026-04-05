import { Router } from 'express';
import {
  getAllCategoriesController,
  getCategoryByIdController,
  getCategoryChildrenController,
  postCategoryController,
  updateCategoryController,
  removeCategoryController,
} from './controllers/category.controller';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *         name:
 *           type: string
 *           example: Anillos
 *         slug:
 *           type: string
 *           example: anillos
 *         description:
 *           type: string
 *           example: Categoría de joyas para ocasiones especiales.
 *         parentId:
 *           type: number
 *           nullable: true
 *           example: 0
 *         parent:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               example: "0"
 *             name:
 *               type: string
 *               example: Categorías
 *             slug:
 *               type: string
 *               example: categorias
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         name:
 *           type: string
 *           example: Anillos
 *         slug:
 *           type: string
 *           example: anillos
 *         description:
 *           type: string
 *           example: Categoría de joyas para ocasiones especiales.
 *         parentId:
 *           type: number
 *           nullable: true
 *           example: 1
 *     CategoryUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Anillos
 *         slug:
 *           type: string
 *           example: anillos
 *         description:
 *           type: string
 *           example: Categoría de joyas para ocasiones especiales.
 *         parentId:
 *           oneOf:
 *             - type: number
 *             - type: 'null'
 *           nullable: true
 *           example: 1
 */

/**
 * @openapi
 * /api/categories:
 *   get:
 *     tags:
 *       - Categorías
 *     summary: Obtener todas las categorías
 *     description: Retorna el listado completo de categorías del catálogo.
 *     responses:
 *       200:
 *         description: Categorías obtenidas correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/', getAllCategoriesController);

/**
 * @openapi
 * /api/categories/{id}:
 *   get:
 *     tags:
 *       - Categorías
 *     summary: Obtener una categoría por ID
 *     description: Retorna la categoría especificada junto con su relación padre e hijos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único de la categoría
 *         example: "1"
 *     responses:
 *       200:
 *         description: Categoría encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Categoría no encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: CATEGORY_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: La categoría solicitada no existe en el catálogo.
 */
router.get('/:id', getCategoryByIdController);

/**
 * @openapi
 * /api/categories/{id}/children:
 *   get:
 *     tags:
 *       - Categorías
 *     summary: Obtener las subcategorías directas
 *     description: Retorna un listado de las categorías que son hijas directas de la categoría especificada.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único de la categoría padre
 *         example: "1"
 *     responses:
 *       200:
 *         description: Subcategorías encontradas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       404:
 *         description: Categoría padre no encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: CATEGORY_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: La categoría padre solicitada no existe.
 */
router.get('/:id/children', getCategoryChildrenController);

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     tags:
 *       - Categorías
 *     summary: Actualizar una categoría existente
 *     description: Modifica los datos de una categoría ya creada.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único de la categoría
 *         example: "1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryUpdateInput'
 *     responses:
 *       200:
 *         description: Categoría actualizada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Datos inválidos o parentId inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: INVALID_PARENT_ID
 *                 message:
 *                   type: string
 *                   example: El parentId suministrado no es válido.
 *       404:
 *         description: Categoría no encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: CATEGORY_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: La categoría solicitada no existe en el catálogo.
 *       409:
 *         description: Slug duplicado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: SLUG_ALREADY_EXISTS
 *                 message:
 *                   type: string
 *                   example: El slug proporcionado ya existe. Por favor, elige otro.
 */
router.put('/:id', updateCategoryController);

/**
 * @openapi
 * /api/categories:
 *   post:
 *     tags:
 *       - Categorías
 *     summary: Crear una nueva categoría
 *     description: Agrega una nueva categoría al catálogo de joyas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Categoría creada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Datos inválidos o faltan campos obligatorios.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: MISSING_FIELDS
 *                 message:
 *                   type: string
 *                   example: Los campos name y slug son obligatorios.
 *       409:
 *         description: El slug ya existe.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: SLUG_ALREADY_EXISTS
 *                 message:
 *                   type: string
 *                   example: El slug proporcionado ya existe. Por favor, elige otro.
 */
router.post('/', postCategoryController);

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     tags:
 *       - Categorías
 *     summary: Eliminar una categoría
 *     description: Elimina permanentemente una categoría del catálogo por su ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único de la categoría a eliminar
 *         example: "1"
 *     responses:
 *       200:
 *         description: Categoría eliminada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Categoría eliminada exitosamente.
 *       404:
 *         description: Categoría no encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: CATEGORY_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: La categoría solicitada no existe en el catálogo.
 *       400:
 *         description: No se puede eliminar porque tiene hijos o productos asociados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   enum: [CATEGORY_HAS_CHILDREN, CATEGORY_HAS_PRODUCTS]
 *                   example: CATEGORY_HAS_CHILDREN
 *                 message:
 *                   type: string
 *                   example: No se puede eliminar la categoría porque tiene subcategorías asociadas.
 */
router.delete('/:id', removeCategoryController);

export default router;
