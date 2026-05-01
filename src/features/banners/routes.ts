import { Router } from 'express';
import {
  authenticateToken,
  requireAdmin,
} from '../../api/middlewares/auth.middleware';
import {
  getBannerController,
  updateBannerController,
  deleteBannerController,
} from './controllers/banner.controller';
import { uploadBannerImage } from '../../api/middlewares/upload.middleware';
import { updateBannerValidator } from '../../api/middlewares/banner.validator';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "Nueva Colección Verano 2024"
 *         subtitle:
 *           type: string
 *           nullable: true
 *           example: "Descubre diseños frescos y elegantes."
 *         imageUrl:
 *           type: string
 *           format: uri
 *           example: "https://example.com/images/banner-verano.webp"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UpdateBannerFormData:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "Ofertas de Invierno"
 *         subtitle:
 *           type: string
 *           example: "Hasta 50% de descuento."
 *         imageFile:
 *           type: string
 *           format: binary
 *           description: "Archivo de imagen para el banner. Si se envía, reemplazará la imagen actual."
 */

/**
 * @openapi
 * /api/banner:
 *   get:
 *     tags:
 *       - Banner
 *     summary: Obtener el banner principal.
 *     description: Devuelve el banner principal único que se muestra en la aplicación. Es público. Si no existe un banner, devuelve un error 404.
 *     responses:
 *       '200':
 *         description: Banner obtenido correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data: # Si la respuesta es exitosa, siempre contendrá el objeto del banner.
 *                   $ref: '#/components/schemas/Banner'
 *                 message:
 *                   type: string
 *                   example: "Banner obtenido correctamente."
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/', getBannerController);

/**
 * @openapi
 * /api/banner:
 *   put:
 *     tags:
 *       - Banner
 *     summary: '[ADMIN] Crear o actualizar el banner con imagen'
 *     description: >
 *       Crea o actualiza el banner principal. Esta operación es un "upsert".
 *       Acepta `multipart/form-data` para incluir un archivo de imagen.
 *       Si se proporciona `imageFile`, la imagen actual será reemplazada.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBannerFormData'
 *     responses:
 *       '200': # O 201 si se crea, pero 200 es común para una operación de tipo "upsert".
 *         description: Banner creado o actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *                 message:
 *                   type: string
 *                   example: "Banner actualizado correctamente."
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put(
  '/',
  authenticateToken,
  requireAdmin,
  uploadBannerImage,
  updateBannerValidator,
  updateBannerController,
);

/**
 * @openapi
 * /api/banner:
 *   delete:
 *     tags:
 *       - Banner
 *     summary: '[ADMIN] Eliminar el banner principal'
 *     description: Elimina permanentemente el banner principal de la base de datos. Requiere rol de administrador.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Banner eliminado correctamente.
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
 *                   example: "Banner eliminado correctamente."
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/', authenticateToken, requireAdmin, deleteBannerController);

export default router;
