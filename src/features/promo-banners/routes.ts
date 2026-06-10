import { Router } from 'express';
import {
  getAllPromoBannersController,
  getPromoBannerByIdController,
  createPromoBannerController,
  updatePromoBannerController,
  deletePromoBannerController,
  reorderPromoBannersController,
} from './controllers/promo-banner.controller';
import {
  authenticateToken,
  requireAdmin,
} from '../../api/middlewares/auth.middleware';
import { uploadPromoBannerImage } from '../../api/middlewares/upload.middleware';
import {
  createPromoBannerValidator,
  updatePromoBannerValidator,
  validateIdParam,
} from '../../api/middlewares/promo-banner.validator';
import { handleValidationErrors } from '../../api/middlewares/validation.middleware';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PromoBanner:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         title: { type: string, nullable: true, example: "Nueva colección" }
 *         subtitle: { type: string, nullable: true, example: "Piezas de oro 18k" }
 *         imageUrl: { type: string, example: "/uploads/promo-banners/uuid.webp" }
 *         position: { type: integer, example: 1 }
 *         linkType:
 *           type: string
 *           enum: [PRODUCT, CATEGORY, NONE]
 *           example: "PRODUCT"
 *         linkProductId:
 *           type: string
 *           nullable: true
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         linkCategoryId: { type: integer, nullable: true, example: null }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

/**
 * @openapi
 * /api/promo-banners:
 *   get:
 *     tags:
 *       - Banners de Promoción
 *     summary: Obtener todos los banners de promoción
 *     description: Lista pública de banners ordenados por posición ascendente, usados en el carrusel hero de la home.
 *     responses:
 *       200:
 *         description: Lista de banners de promoción.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PromoBanner'
 */
router.get('/', asyncHandler(getAllPromoBannersController));

/**
 * @openapi
 * /api/promo-banners/reorder:
 *   put:
 *     tags:
 *       - Banners de Promoción
 *     summary: '[ADMIN] Reordenar los banners de promoción'
 *     description: Recibe la totalidad de los banners con su nueva posición (consecutivas desde 1).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 3 }
 *                     position: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Banners reordenados correctamente.
 *       400:
 *         description: Reordenamiento inválido (posiciones no consecutivas, faltan banners, etc.).
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put(
  '/reorder',
  authenticateToken,
  requireAdmin,
  asyncHandler(reorderPromoBannersController),
);

/**
 * @openapi
 * /api/promo-banners/{id}:
 *   get:
 *     tags:
 *       - Banners de Promoción
 *     summary: '[ADMIN] Obtener un banner de promoción por ID'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Banner encontrado.
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateIdParam,
  handleValidationErrors,
  asyncHandler(getPromoBannerByIdController),
);

/**
 * @openapi
 * /api/promo-banners:
 *   post:
 *     tags:
 *       - Banners de Promoción
 *     summary: '[ADMIN] Crear un banner de promoción (límite de 10)'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               subtitle: { type: string }
 *               linkType:
 *                 type: string
 *                 enum: [PRODUCT, CATEGORY, NONE]
 *               linkProductId: { type: string }
 *               linkCategoryId: { type: integer }
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Banner creado correctamente.
 *       400:
 *         description: >
 *           Error de validación o límite de 10 banners alcanzado
 *           (`VALIDATION_ERROR` o `MAX_ITEMS_REACHED`).
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  uploadPromoBannerImage,
  createPromoBannerValidator,
  handleValidationErrors,
  asyncHandler(createPromoBannerController),
);

/**
 * @openapi
 * /api/promo-banners/{id}:
 *   put:
 *     tags:
 *       - Banners de Promoción
 *     summary: '[ADMIN] Actualizar un banner de promoción'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               subtitle: { type: string }
 *               linkType:
 *                 type: string
 *                 enum: [PRODUCT, CATEGORY, NONE]
 *               linkProductId: { type: string }
 *               linkCategoryId: { type: integer }
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Banner actualizado correctamente.
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
  uploadPromoBannerImage,
  validateIdParam,
  updatePromoBannerValidator,
  handleValidationErrors,
  asyncHandler(updatePromoBannerController),
);

/**
 * @openapi
 * /api/promo-banners/{id}:
 *   delete:
 *     tags:
 *       - Banners de Promoción
 *     summary: '[ADMIN] Eliminar un banner de promoción'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Banner eliminado correctamente.
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
  asyncHandler(deletePromoBannerController),
);

export default router;
