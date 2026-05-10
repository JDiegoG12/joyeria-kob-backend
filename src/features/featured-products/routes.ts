import { Router } from 'express';
import {
  authenticateToken,
  requireAdmin,
} from '../../api/middlewares/auth.middleware';
import {
  addFeaturedProductController,
  getFeaturedProductsController,
  removeFeaturedProductController,
  reorderFeaturedProductsController,
} from './controllers/featured-product.controller';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     FeaturedProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         productId:
 *           type: string
 *           format: uuid
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         position:
 *           type: integer
 *           example: 1
 *         product:
 *           $ref: '#/components/schemas/Product'
 *
 *     FeaturedProductInput:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *
 *     FeaturedProductReorderInput:
 *       type: array
 *       items:
 *         type: object
 *         required:
 *           - productId
 *           - position
 *         properties:
 *           productId:
 *             type: string
 *             format: uuid
 *           position:
 *             type: integer
 *             example: 1
 */

/**
 * @openapi
 * /api/featured-products:
 *   get:
 *     tags:
 *       - Productos Destacados
 *     summary: Obtener productos destacados
 *     description: Retorna los productos destacados ordenados por position asc.
 *     responses:
 *       '200':
 *         description: Productos destacados obtenidos correctamente.
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
 *                     $ref: '#/components/schemas/FeaturedProduct'
 *                 message:
 *                   type: string
 *                   example: "Productos destacados obtenidos correctamente."
 */
router.get('/', getFeaturedProductsController);

/**
 * @openapi
 * /api/featured-products:
 *   post:
 *     tags:
 *       - Productos Destacados
 *     summary: '[ADMIN] Agregar producto destacado'
 *     description: Agrega un producto destacado asignando la ultima posicion.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeaturedProductInput'
 *     responses:
 *       '201':
 *         description: Producto destacado agregado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FeaturedProduct'
 *                 message:
 *                   type: string
 *                   example: "Producto destacado agregado correctamente."
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', authenticateToken, requireAdmin, addFeaturedProductController);

/**
 * @openapi
 * /api/featured-products/{productId}:
 *   delete:
 *     tags:
 *       - Productos Destacados
 *     summary: '[ADMIN] Eliminar producto destacado'
 *     description: Elimina el producto de la lista de destacados.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Producto destacado eliminado correctamente.
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
 *                   example: "Producto destacado eliminado correctamente."
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:productId',
  authenticateToken,
  requireAdmin,
  removeFeaturedProductController,
);

/**
 * @openapi
 * /api/featured-products/reorder:
 *   put:
 *     tags:
 *       - Productos Destacados
 *     summary: '[ADMIN] Reordenar productos destacados'
 *     description: Actualiza las posiciones usando una transaccion.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeaturedProductReorderInput'
 *     responses:
 *       '200':
 *         description: Productos destacados reordenados correctamente.
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
 *                     $ref: '#/components/schemas/FeaturedProduct'
 *                 message:
 *                   type: string
 *                   example: "Productos destacados reordenados correctamente."
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put(
  '/reorder',
  authenticateToken,
  requireAdmin,
  reorderFeaturedProductsController,
);

export default router;
