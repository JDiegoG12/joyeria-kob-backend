import { Router } from 'express';
import {
  getCurrentGoldPriceController,
  updateGoldPriceController,
} from './controllers/gold-price.controller';
import { authMiddleware } from '../../api/middlewares/auth.middleware';
import { requireAdmin } from '../../api/middlewares/require-admin.middleware';

const router = Router();

// Aplicar middlewares de seguridad a todas las rutas de este router
router.use(authMiddleware);
router.use(requireAdmin);

/**
 * @openapi
 * /api/admin/gold-price:
 *   get:
 *     tags:
 *       - Administración
 *     summary: Obtener el precio actual del oro
 *     description: Retorna el precio actual del oro por gramo y la fecha de su última actualización. Requiere rol de administrador.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Precio del oro obtenido correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessGoldPriceResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/gold-price', getCurrentGoldPriceController);

/**
 * @openapi
 * /api/admin/gold-price:
 *   put:
 *     tags:
 *       - Administración
 *     summary: Actualizar el precio del oro
 *     description: Actualiza el precio del oro por gramo en la configuración del sistema. Requiere rol de administrador.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGoldPriceRequest'
 *     responses:
 *       200:
 *         description: Precio del oro actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessGoldPriceResponse'
 *       400:
 *         description: El precio enviado es inválido (no es un número positivo).
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/gold-price', updateGoldPriceController);

/**
 * @openapi
 * components:
 *   schemas:
 *     GoldPriceResponse:
 *       type: object
 *       properties:
 *         goldPricePerGram:
 *           type: number
 *           example: 350000
 *         lastUpdate:
 *           type: string
 *           format: date-time
 *           example: '2023-10-27T10:00:00.000Z'
 *     UpdateGoldPriceRequest:
 *       type: object
 *       required:
 *         - goldPricePerGram
 *       properties:
 *         goldPricePerGram:
 *           type: number
 *           description: El nuevo precio del oro por gramo. Debe ser un número positivo.
 *           example: 365000
 *     SuccessGoldPriceResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/GoldPriceResponse'
 *         message:
 *           type: string
 *           example: 'Precio del oro actualizado correctamente.'
 *   responses:
 *     ForbiddenError:
 *       description: Acceso denegado. Se requieren privilegios de administrador.
 */
export default router;
