import { Router } from 'express';
import {
  updateGoldPriceController,
  getGoldPriceHistoryController,
} from './controllers/gold-price.controller';
import {
  authenticateToken,
  requireAdmin,
} from '../../api/middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/system/gold-price/history:
 *   get:
 *     tags:
 *       - Configuración y Métricas
 *     summary: Obtener historial del precio del oro
 *     description: Retorna una lista cronológica de todos los cambios de precio del oro realizados en el sistema, ideal para gráficos y métricas. Requiere rol de administrador.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Historial obtenido correctamente." }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer, example: 1 }
 *                       goldPricePerGram: { type: number, example: 350000 }
 *                       date: { type: string, format: date-time }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/history',
  authenticateToken,
  requireAdmin,
  getGoldPriceHistoryController,
);
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
router.put(
  '/gold-price',
  authenticateToken,
  requireAdmin,
  updateGoldPriceController,
);

/**
 * @openapi
 * components:
 *   schemas:
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
