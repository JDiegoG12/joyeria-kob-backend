import { Router } from 'express';
import {
  authenticateToken,
  requireAdmin,
} from '../../api/middlewares/auth.middleware';
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
 *           type: number
 *           example: 1
 *         name:
 *           type: string
 *           example: "Anillos"
 *         slug:
 *           type: string
 *           example: "anillos"
 *         description:
 *           type: string
 *           example: "Categoría de joyas para ocasiones especiales."
 *         parentId:
 *           type: number
 *           nullable: true
 *           example: null
 *         parent:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: number
 *               example: 1
 *             name:
 *               type: string
 *               example: "Joyas"
 *             slug:
 *               type: string
 *               example: "joyas"
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Collares"
 *         description:
 *           type: string
 *           example: "Collares de oro y plata."
 *         parentId:
 *           type: number
 *           nullable: true
 *           example: 1
 *
 *     CategoryUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Anillos de Compromiso"
 *         description:
 *           type: string
 *           example: "Anillos de compromiso con diamantes."
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
 *     description: Retorna el listado completo de categorías del catálogo, incluyendo sus relaciones de padre e hijos.
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
 *                 message:
 *                   type: string
 *                   example: 'Operación exitosa.'
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
 *           type: number
 *         description: ID único de la categoría
 *         example: 1
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
 *                 message:
 *                   type: string
 *                   example: 'Categoría obtenida correctamente.'
 *       404:
 *         description: La categoría solicitada no existe.
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
 *                   example: "CATEGORY_NOT_FOUND"
 *                 message:
 *                   type: string
 *                   example: "La categoría solicitada no existe en el catálogo."
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
 *           type: number
 *         description: ID único de la categoría padre
 *         example: 1
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
 *                 message:
 *                   type: string
 *                   example: 'Subcategorías obtenidas correctamente.'
 *       404:
 *         description: La categoría padre no fue encontrada.
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
 *                   example: "CATEGORY_NOT_FOUND"
 *                 message:
 *                   type: string
 *                   example: "La categoría padre solicitada no existe."
 */
router.get('/:id/children', getCategoryChildrenController);

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     tags:
 *       - Categorías
 *     summary: '[ADMIN] Actualizar una categoría existente'
 *     description: Modifica los datos de una categoría ya creada. El slug se actualiza automáticamente si cambia el nombre.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: ID único de la categoría a actualizar
 *         example: 1
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
 *                 message:
 *                   type: string
 *                   example: 'Categoría actualizada correctamente.'
 *       400:
 *         description: Error de validación o datos de entrada incorrectos.
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
 *                   example: "VALIDATION_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Error de validación en los datos de entrada."
 *       404:
 *         description: La categoría a actualizar no fue encontrada.
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
 *                   example: "CATEGORY_NOT_FOUND"
 *                 message:
 *                   type: string
 *                   example: "La categoría solicitada no existe en el catálogo."
 *       409:
 *         description: Conflicto, el nombre de la categoría ya existe.
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
 *                   example: "NAME_ALREADY_EXISTS"
 *                 message:
 *                   type: string
 *                   example: "El nombre de categoría 'Anillos de Compromiso' ya existe."
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/:id', authenticateToken, requireAdmin, updateCategoryController);

/**
 * @openapi
 * /api/categories:
 *   post:
 *     tags:
 *       - Categorías
 *     summary: '[ADMIN] Crear una nueva categoría'
 *     description: Agrega una nueva categoría al catálogo de joyas. El slug se genera automáticamente a partir del nombre.
 *     security:
 *       - bearerAuth: []
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
 *                 message:
 *                   type: string
 *                   example: 'Categoría creada correctamente.'
 *       400:
 *         description: Error de validación en los datos de entrada.
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
 *                   example: "VALIDATION_ERROR"
 *                 message:
 *                   type: string
 *                   example: "Error de validación en los datos de entrada."
 *       409:
 *         description: Conflicto, el nombre de la categoría ya existe en ese nivel.
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
 *                   example: "NAME_ALREADY_EXISTS"
 *                 message:
 *                   type: string
 *                   example: "El nombre de categoría 'Collares' ya existe en este nivel."
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', authenticateToken, requireAdmin, postCategoryController);

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     tags:
 *       - Categorías
 *     summary: '[ADMIN] Eliminar una categoría'
 *     description: Elimina permanentemente una categoría del catálogo por su ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: ID único de la categoría a eliminar
 *         example: 1
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
 *                 data:
 *                   type: object
 *                   properties:
 *                      message:
 *                         type: string
 *                         example: "Categoría eliminada exitosamente."
 *                 message:
 *                   type: string
 *                   example: "Categoría eliminada exitosamente."
 *       404:
 *         description: La categoría a eliminar no fue encontrada.
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
 *                   example: "CATEGORY_NOT_FOUND"
 *                 message:
 *                   type: string
 *                   example: "La categoría solicitada no existe en el catálogo."
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
 *                   example: "No se puede eliminar la categoría porque tiene subcategorías asociadas."
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  removeCategoryController,
);

export default router;
