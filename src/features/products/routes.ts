import { Router } from 'express';
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
 *           example: "1"
 *         name:
 *           type: string
 *           example: Anillo Esmeralda Colonial
 *         description:
 *           type: string
 *           example: Anillo en oro de 18k con esmeralda colombiana certificada.
 *         priceCop:
 *           type: number
 *           example: 4500000
 *         material:
 *           type: string
 *           enum: [oro, plata, platino]
 *           example: oro
 *         stock:
 *           type: number
 *           example: 3
 *     ProductInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - priceCop
 *         - material
 *         - stock
 *       properties:
 *         name:
 *           type: string
 *           example: Pulsera Platino
 *         description:
 *           type: string
 *           example: Pulsera artesanal en platino con acabado mate.
 *         priceCop:
 *           type: number
 *           example: 7200000
 *         material:
 *           type: string
 *           enum: [oro, plata, platino]
 *           example: platino
 *         stock:
 *           type: number
 *           example: 5
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
 */
router.get('/', getProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Productos
 *     summary: Obtener una joya por ID
 *     description: Retorna los datos completos de una joya específica.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único de la joya
 *         example: "1"
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
 *     summary: Crear una nueva joya
 *     description: Agrega una nueva joya al catálogo de Joyería KOB.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Joya creada correctamente.
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
 *       400:
 *         description: Faltan campos obligatorios.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: MISSING_FIELDS
 *                 message:
 *                   type: string
 *                   example: Todos los campos son obligatorios.
 */
router.post('/', postProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags:
 *       - Productos
 *     summary: Eliminar una joya
 *     description: Elimina permanentemente una joya del catálogo por su ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único de la joya a eliminar
 *         example: "1"
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