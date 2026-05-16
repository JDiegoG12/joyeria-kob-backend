import { Router } from 'express';
import {
  createSocialContentController,
  deleteSocialContentController,
  getAllSocialContentsController,
  getSocialContentByIdController,
  updateSocialContentController,
} from './controllers/social-content.controller';
import {
  authenticateToken,
  requireAdmin,
} from '../../api/middlewares/auth.middleware';
import { uploadSocialContentImage } from '../../api/middlewares/upload.middleware';
import {
  createSocialContentValidator,
  updateSocialContentValidator,
  validateIdParam,
} from '../../api/middlewares/social-content.validator';
import { handleValidationErrors } from '../../api/middlewares/validation.middleware';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SocialContent:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "Nuevos Anillos de Compromiso"
 *         imageUrl:
 *           type: string
 *           example: "/uploads/social-content/uuid.webp"
 *         link:
 *           type: string
 *           example: "https://www.instagram.com/p/Cj..."
 *         socialNetwork:
 *           type: string
 *           enum: [YOUTUBE, TIKTOK, INSTAGRAM, FACEBOOK, OTHER]
 *           example: "INSTAGRAM"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     SocialContentGetResponse:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         title: { type: string }
 *         imageUrl: { type: string }
 *         link: { type: string }
 *         socialNetwork:
 *           type: string
 *           enum: [YOUTUBE, TIKTOK, INSTAGRAM, FACEBOOK, OTHER]
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         title: "Nuevos Anillos de Compromiso"
 *         imageUrl: "/uploads/social-content/uuid.webp"
 *         link: "https://www.instagram.com/p/Cj..."
 *         socialNetwork: "INSTAGRAM"
 *         createdAt: "2024-05-16T12:00:00.000Z"
 *     SocialContentUpdateResponse:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         title: { type: string }
 *         imageUrl: { type: string }
 *         link: { type: string }
 *         socialNetwork:
 *           type: string
 *           enum: [YOUTUBE, TIKTOK, INSTAGRAM, FACEBOOK, OTHER]
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         title: "Anillos de Compromiso Actualizados"
 *         imageUrl: "/uploads/social-content/new-uuid.webp"
 *         link: "https://www.instagram.com/p/Cj..."
 *         socialNetwork: "INSTAGRAM"
 *         updatedAt: "2024-05-16T13:00:00.000Z"
 */

/**
 * @openapi
 * /api/social-contents:
 *   get:
 *     tags:
 *       - Contenido Social
 *     summary: Obtener todos los contenidos sociales
 *     description: Devuelve una lista de todos los contenidos sociales para mostrar en el frontend.
 *     responses:
 *       200:
 *         description: Lista de contenidos sociales.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SocialContentGetResponse'
 */
router.get('/', getAllSocialContentsController);

/**
 * @openapi
 * /api/social-contents/{id}:
 *   get:
 *     tags:
 *       - Contenido Social
 *     summary: Obtener un contenido social por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contenido social encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/SocialContentGetResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  validateIdParam,
  handleValidationErrors,
  getSocialContentByIdController,
);

/**
 * @openapi
 * /api/social-contents:
 *   post:
 *     tags:
 *       - Contenido Social
 *     summary: Crear un nuevo contenido social (límite de 10)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               link:
 *                 type: string
 *               socialNetwork:
 *                 type: string
 *                 enum: [YOUTUBE, TIKTOK, INSTAGRAM, FACEBOOK, OTHER]
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Contenido creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/SocialContentGetResponse' }
 *       400:
 *         description: >
 *           Error de validación o se ha alcanzado el límite de 10 contenidos.
 *           El campo `error` puede ser `VALIDATION_ERROR` o `MAX_ITEMS_REACHED`.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  uploadSocialContentImage,
  createSocialContentValidator,
  handleValidationErrors,
  createSocialContentController,
);

/**
 * @openapi
 * /api/social-contents/{id}:
 *   put:
 *     tags:
 *       - Contenido Social
 *     summary: Actualizar un contenido social existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               link:
 *                 type: string
 *               socialNetwork:
 *                 type: string
 *                 enum: [YOUTUBE, TIKTOK, INSTAGRAM, FACEBOOK, OTHER]
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Contenido actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/SocialContentUpdateResponse' }
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  uploadSocialContentImage,
  validateIdParam,
  updateSocialContentValidator,
  handleValidationErrors,
  updateSocialContentController,
);

/**
 * @openapi
 * /api/social-contents/{id}:
 *   delete:
 *     tags:
 *       - Contenido Social
 *     summary: Eliminar un contenido social
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contenido eliminado exitosamente.
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam,
  handleValidationErrors,
  deleteSocialContentController,
);

export default router;
