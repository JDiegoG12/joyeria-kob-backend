import { Router } from 'express';
import { getCurrentGoldPriceController } from './controllers/system.controller';

const router = Router();

/**
 * @openapi
 * /api/system/gold-price:
 *   get:
 *     tags:
 *       - Sistema
 *     summary: Obtener el precio actual del oro
 *     description: Retorna el precio actual del oro por gramo y la fecha de su última actualización. Este endpoint es público y de solo lectura.
 *     responses:
 *       '200':
 *         description: Precio del oro obtenido correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/GoldPriceResponse'
 *                 message:
 *                   type: string
 *                   example: "Precio del oro obtenido correctamente."
 *       '404':
 *         description: El precio del oro aún no ha sido configurado en el sistema.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: 'string'
 *                   example: 'GOLD_PRICE_NOT_FOUND'
 *                 message:
 *                   type: 'string'
 *                   example: 'El precio del oro no ha sido configurado.'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
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
 */
router.get('/gold-price', getCurrentGoldPriceController);

export default router;
