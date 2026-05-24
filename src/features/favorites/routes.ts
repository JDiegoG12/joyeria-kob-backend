import { Router } from 'express';
import { authenticateToken } from '../../api/middlewares/auth.middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import {
  addFavoriteController,
  getFavoritesController,
  removeFavoriteController,
} from './controllers/favorite.controller';

const router = Router();

// Todas las rutas de favoritos deben estar protegidas
router.use(authenticateToken);

/**
 * @openapi
 * components:
 *   schemas:
 *     Favorite:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         productId:
 *           type: string
 *           format: uuid
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         product:
 *           $ref: '#/components/schemas/Product'
 *
 *     FavoriteInput:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 */

/**
 * @openapi
 * /api/favorites:
 *   get:
 *     tags:
 *       - Favoritos
 *     summary: Obtener favoritos del usuario
 *     description: Retorna la lista de favoritos, solo con productos AVAILABLE.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de favoritos obtenida correctamente.
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
 *                     $ref: '#/components/schemas/Favorite'
 *                 message:
 *                   type: string
 *                   example: "Favoritos obtenidos correctamente."
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', asyncHandler(getFavoritesController));

/**
 * @openapi
 * /api/favorites:
 *   post:
 *     tags:
 *       - Favoritos
 *     summary: Agregar a favoritos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FavoriteInput'
 *     responses:
 *       '201':
 *         description: Agregado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Favorite'
 *                 message:
 *                   type: string
 *                   example: "Producto agregado a favoritos."
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '409':
 *         description: El producto ya esta en favoritos.
 */
router.post('/', asyncHandler(addFavoriteController));

/**
 * @openapi
 * /api/favorites/{productId}:
 *   delete:
 *     tags:
 *       - Favoritos
 *     summary: Eliminar de favoritos
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
 *         description: Eliminado exitosamente.
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
 *                   example: "Producto eliminado de favoritos."
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:productId', asyncHandler(removeFavoriteController));

export default router;
