import { Router } from 'express';
import { uploadJewelImages } from '../../api/middlewares/upload.middleware';
import {
  getProducts,
  getProduct,
  postProduct,
  removeProduct,
} from './controllers/product.controller';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         categoryId:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Anillo Solitario Zafiro Real"
 *         description:
 *           type: string
 *           example: "Anillo en oro blanco de 18k con zafiro central."
 *         baseWeight:
 *           type: number
 *           example: 4.5
 *         additionalValue:
 *           type: number
 *           example: 1200000
 *         laborCost:
 *           type: number
 *           example: 0
 *         calculatedPrice:
 *           type: number
 *           example: 3225000
 *         stock:
 *           type: integer
 *           example: 5
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OUT_OF_STOCK, HIDDEN]
 *           example: AVAILABLE
 *         specifications:
 *           type: object
 *           example: { "requiresSize": true, "hasStones": true, "stoneType": "Zafiro" }
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: ["https://res.cloudinary.com/joyeria/image1.jpg"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ProductInput:
 *       type: object
 *       required:
 *         - categoryId
 *         - name
 *         - description
 *         - baseWeight
 *         - additionalValue
 *         - laborCost
 *         - stock
 *         - specifications
 *         - images
 *       properties:
 *         categoryId:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Anillo Esmeralda Colonial"
 *         description:
 *           type: string
 *           example: "Anillo en oro de 18k con esmeralda colombiana certificada."
 *         baseWeight:
 *           type: number
 *           example: 3.8
 *         additionalValue:
 *           type: number
 *           example: 850000
 *         laborCost:
 *           type: number
 *           example: 0
 *         stock:
 *           type: integer
 *           example: 10
 *         specifications:
 *           type: object
 *           example: { "requiresSize": true, "hasStones": true }
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: ["https://cloudinary.com/img.jpg"]
 */

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags:
 *       - Productos
 *     summary: Obtener todas las joyas
 *     description: Retorna el listado completo de joyas disponibles en el catálogo.
 *     responses:
 *       200:
 *         description: Listado de joyas obtenido correctamente.
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
 *                     $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *                   example: "Catálogo obtenido correctamente."
 */
router.get('/', getProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Productos
 *     summary: Obtener una joya por ID
 *     description: Retorna los datos completos de una joya específica usando su UUID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la joya
 *         example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *     responses:
 *       200:
 *         description: Joya encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getProduct);

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags:
 *       - Productos
 *     summary: Crear una nueva joya con imágenes
 *     description: Agrega una nueva joya cargando archivos reales y calculando el precio automáticamente.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "Anillo Zafiro"
 *               description:
 *                 type: string
 *                 example: "Oro 18k"
 *               baseWeight:
 *                 type: number
 *                 example: 4.5
 *               additionalValue:
 *                 type: number
 *                 example: 500000
 *               laborCost:
 *                 type: number
 *                 example: 100000
 *               stock:
 *                 type: integer
 *                 example: 5
 *               specifications:
 *                 type: string
 *                 example: '{"requiresSize":true}'
 *               imageFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Joya creada correctamente.
 */
router.post('/', uploadJewelImages, postProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags:
 *       - Productos
 *     summary: Eliminar una joya
 *     description: Elimina permanentemente una joya del catálogo por su UUID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la joya a eliminar
 *         example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *     responses:
 *       200:
 *         description: Joya eliminada correctamente.
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
 *                   example: Producto eliminado correctamente.
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', removeProduct);

export default router;
