import { Router } from 'express';
import {
  authenticateToken,
  requireAdmin,
} from '../../api/middlewares/auth.middleware';
import { asyncHandler } from '../../shared/utils/async-handler';
import {
  getCustomersController,
  getCustomerFavoritesController,
} from './controllers/customer.controller';

/**
 * Router del módulo de Clientes (panel administrativo).
 *
 * Se monta en `/api/users` (junto al router de autenticación). Todas las rutas
 * requieren un token válido Y rol de administrador.
 */
const router = Router();

// Todas las rutas de este módulo son exclusivas del administrador.
router.use(authenticateToken, requireAdmin);

/**
 * @openapi
 * components:
 *   schemas:
 *     CustomerListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: 'Juan'
 *         lastName:
 *           type: string
 *           example: 'Pérez'
 *         phone:
 *           type: string
 *           nullable: true
 *           example: '3101234567'
 *         email:
 *           type: string
 *           format: email
 *           example: 'cliente@test.com'
 *         role:
 *           type: string
 *           enum: [CLIENT, ADMIN]
 *           example: 'CLIENT'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         favoritesCount:
 *           type: integer
 *           example: 3
 *     CustomersPagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 42
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalPages:
 *           type: integer
 *           example: 5
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPrevPage:
 *           type: boolean
 *           example: false
 */

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Clientes (Admin)
 *     summary: Listar clientes (paginado)
 *     description: >
 *       Devuelve el listado paginado de usuarios con rol CLIENT. Permite buscar
 *       por nombre, apellido, correo o teléfono. Solo accesible para administradores.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página (1-indexado).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Cantidad de clientes por página.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda por nombre, apellido, correo o teléfono.
 *     responses:
 *       '200':
 *         description: Listado de clientes obtenido correctamente.
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CustomerListItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/CustomersPagination'
 *                 message:
 *                   type: string
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         description: El usuario autenticado no es administrador.
 */
router.get('/', asyncHandler(getCustomersController));

/**
 * @openapi
 * /api/users/{id}/favorites:
 *   get:
 *     tags:
 *       - Clientes (Admin)
 *     summary: Obtener favoritos de un cliente
 *     description: >
 *       Devuelve todos los favoritos de un cliente (incluyendo productos no
 *       disponibles). Solo accesible para administradores.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del cliente.
 *     responses:
 *       '200':
 *         description: Favoritos obtenidos correctamente.
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
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         description: El usuario autenticado no es administrador.
 *       '404':
 *         description: El cliente solicitado no existe.
 */
router.get('/:id/favorites', asyncHandler(getCustomerFavoritesController));

export default router;
