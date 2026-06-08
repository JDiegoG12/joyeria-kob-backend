import { Router } from 'express';
import { uploadJewelImages } from '../../api/middlewares/upload.middleware';
import {
  authenticateToken,
  requireAdmin,
  optionalAuthenticateToken,
} from '../../api/middlewares/auth.middleware';
import {
  getProducts,
  getCatalogProducts,
  getProduct,
  postProduct,
  removeProduct,
  putProduct,
} from './controllers/product.controller';
import {
  getProductStatsController,
  getTopFavoriteProductsController,
} from './controllers/product-stats.controller';
import { asyncHandler } from '../../shared/utils/async-handler';

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
 *         calculatedPrice:
 *           type: number
 *           example: 3225000
 *         discountValue:
 *           type: number
 *           description: Descuento fijo en COP. 0 = sin descuento.
 *           example: 200000
 *         finalPrice:
 *           type: number
 *           description: Precio con el descuento aplicado (calculatedPrice - discountValue, nunca menor a 0).
 *           example: 3025000
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
 *         category:
 *           type: object
 *           description: Información de la categoría y su jerarquía (Padre).
 *           properties:
 *             id: { type: integer, example: 2 }
 *             name: { type: string, example: "Anillos de Compromiso" }
 *             slug: { type: string, example: "anillos-de-compromiso" }
 *             parentId: { type: integer, nullable: true, example: 1 }
 *             parent:
 *               type: object
 *               nullable: true
 *               description: Si es una subcategoría, aquí viene la info del padre.
 *               properties:
 *                 id: { type: integer, example: 1 }
 *                 name: { type: string, example: "Anillos" }
 *                 slug: { type: string, example: "anillos" }
 *
 *     ProductInput:
 *       type: object
 *       required:
 *         - categoryId
 *         - name
 *         - description
 *         - baseWeight
 *         - additionalValue
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
 *         stock:
 *           type: integer
 *           example: 10
 *         specifications:
 *           type: object
 *           example: { "requiresSize": true, "hasStones": true }
 *         images:
 *           type: array
 *           maxItems: 5
 *           items:
 *             type: string
 *           example: ["https://cloudinary.com/img.jpg"]
 *
 *     ProductUpdateInput:
 *       type: object
 *       description: Todos los campos son opcionales para permitir actualizaciones parciales.
 *       properties:
 *         categoryId:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Anillo Zafiro Actualizado"
 *         description:
 *           type: string
 *           example: "Descripción corregida."
 *         baseWeight:
 *           type: number
 *           example: 4.5
 *         additionalValue:
 *           type: number
 *           example: 1500000
 *         stock:
 *           type: integer
 *           example: 0
 *         discountValue:
 *           type: number
 *           description: Descuento fijo en COP. Debe ser >= 0 y no superar el precio actual. Enviar 0 para quitar el descuento.
 *           example: 200000
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OUT_OF_STOCK, HIDDEN]
 *           example: HIDDEN
 *         specifications:
 *           type: string
 *           example: '{"requiresSize": true, "hasStones": true}'
 *         imagesToDelete:
 *           type: string
 *           description: >
 *             Arreglo de nombres de imágenes a eliminar, DEBE enviarse como String JSON.
 *             Ejemplo en frontend: `formData.append('imagesToDelete', JSON.stringify(['uuid-viejo.webp']))`
 *           example: '["d4f6a1-xyz.webp", "a7b8c9-abc.webp"]'
 *         imageFiles:
 *           type: array
 *           description: >
 *             Archivos NUEVOS a agregar. Se sumarán a las imágenes que no fueron borradas.
 *             La suma de (imágenes existentes - imagesToDelete + imageFiles) NO puede superar 5.
 *           maxItems: 5
 *           items:
 *             type: string
 *             format: binary
 *
 *     TopFavoriteProduct:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         name:
 *           type: string
 *           example: "Anillo Solitario Zafiro Real"
 *         favoritesCount:
 *           type: integer
 *           example: 42
 */

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags:
 *       - Productos
 *     summary: Obtener todas las joyas
 *     description: Retorna el listado completo de joyas disponibles en el catálogo. Filtra automáticamente las joyas inactivas a menos que se solicite la vista de administrador.
 *     parameters:
 *       - in: query
 *         name: admin
 *         schema:
 *           type: boolean
 *         description: "Si se establece en true, se mostrarán todas las joyas incluyendo las ocultas."
 *         example: true
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: "Filtra por ID de categoría. Si el ID pertenece a una categoría principal, devolverá automáticamente los productos de sus subcategorías."
 *         example: 1
 *     responses:
 *       '200':
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
 *                 error:
 *                   type: string
 *                   example: "INTERNAL_ERROR"
 */
router.get('/', asyncHandler(getProducts));

/**
 * @openapi
 * /api/products/catalog:
 *   get:
 *     tags:
 *       - Productos
 *     summary: Obtener catálogo público con paginación
 *     description: Retorna productos disponibles del catálogo público con filtros por categoría, rango de precio y búsqueda por nombre.
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: "Filtra por ID de categoría. Si el ID pertenece a una categoría principal, devolverá automáticamente los productos de sus subcategorías."
 *         example: 1
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: "Filtra por precio mínimo (calculatedPrice >= minPrice)."
 *         example: 100000
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: "Filtra por precio máximo (calculatedPrice <= maxPrice)."
 *         example: 2500000
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Búsqueda parcial por nombre (insensible a mayúsculas si la collation lo permite)."
 *         example: "anillo"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: "Número de página, base 1. Default: 1."
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           minimum: 1
 *           maximum: 48
 *         description: "Productos por página. Default: 12, máximo: 48."
 *         example: 12
 *     responses:
 *       '200':
 *         description: Catálogo obtenido correctamente.
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
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 183
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 12
 *                         totalPages:
 *                           type: integer
 *                           example: 16
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                     priceRange:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: number
 *                           example: 31000
 *                         max:
 *                           type: number
 *                           example: 22264000
 *                 message:
 *                   type: string
 *                   example: "Catalogo obtenido correctamente."
 *                 error:
 *                   type: string
 *                   example: "INTERNAL_ERROR"
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/catalog', asyncHandler(getCatalogProducts));

/**
 * @openapi
 * /api/products/stats:
 *   get:
 *     tags:
 *       - Productos
 *     summary: Obtener estadísticas de productos
 *     description: >
 *       Devuelve estadísticas sobre la cantidad de productos. Es un endpoint público con funcionalidades extendidas para administradores.
 *       - **Público/Clientes**: Solo pueden ver estadísticas de productos 'AVAILABLE'. No pueden agrupar por estado ni filtrar por estado.
 *       - **Administradores (con token)**: Pueden ver todos los productos, filtrar por un estado específico y agrupar por categoría o estado.
 *       - Si se proporciona `categoryId`, el parámetro `agrupar` será ignorado y la respuesta será un conteo simple para esa categoría.
 *     security: # Se añade el esquema de seguridad para indicar que puede recibir un token.
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agrupar
 *         schema:
 *           type: string
 *           enum: [categoria, estado]
 *         description: 'Agrupa los resultados. `estado` solo está permitido para administradores. Este parámetro es ignorado si `categoryId` está presente.'
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: 'ID de la categoría para la cual se desean las estadísticas. Si se proporciona, se devolverá un conteo simple de productos en esa categoría.'
 *         example: 5
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, OUT_OF_STOCK, HIDDEN]
 *         description: 'Filtra por un estado específico. Solo para administradores.'
 *     responses:
 *       '200':
 *         description: Estadísticas obtenidas correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object # La respuesta principal es un objeto
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Estadísticas obtenidas correctamente."
 *                 data: # La propiedad 'data' puede ser uno de estos esquemas
 *                   oneOf:
 *                     - type: object
 *                       properties:
 *                         totalProductos:
 *                           type: integer
 *                           example: 150
 *                         porCategoria:
 *                           type: object
 *                           description: 'Presente si se agrupa por `categoria`.'
 *                           example: { "Anillos": 50, "Collares": 100 }
 *                         porEstado:
 *                           type: object
 *                           description: 'Presente si se agrupa por `estado` (solo admin).'
 *                           example: { "AVAILABLE": 120, "OUT_OF_STOCK": 30 }
 *                     - $ref: '#/components/schemas/CategoryStatsResponse' # Cuando se filtra por categoryId
 *       '400':
 *         description: Parámetros de consulta inválidos.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         description: Acceso denegado (ej. cliente intentando agrupar por estado).
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/stats',
  optionalAuthenticateToken,
  asyncHandler(getProductStatsController),
);

/**
 * @openapi
 * /api/products/favorites/top:
 *   get:
 *     tags:
 *       - Productos
 *     summary: '[ADMIN] Obtener top de productos con mas favoritos'
 *     description: Retorna los productos AVAILABLE con mas usuarios en favoritos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Cantidad maxima de productos a retornar.
 *     responses:
 *       '200':
 *         description: Top de favoritos obtenido correctamente.
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
 *                     $ref: '#/components/schemas/TopFavoriteProduct'
 *                 message:
 *                   type: string
 *                   example: "Top de favoritos obtenido correctamente."
 *       '400':
 *         $ref: '#/components/responses/BadRequestError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/favorites/top',
  authenticateToken,
  requireAdmin,
  asyncHandler(getTopFavoriteProductsController),
);

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
 *                 message:
 *                   type: string
 *                   example: "Producto obtenido correctamente."
 *                 error:
 *                   type: string
 *                   example: "PRODUCT_NOT_FOUND"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', asyncHandler(getProduct));

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags:
 *       - Productos
 *     summary: '[ADMIN] Crear una nueva joya con imágenes'
 *     description: Agrega una nueva joya cargando archivos reales y calculando el precio automáticamente.
 *     security:
 *       - bearerAuth: []
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
 *               stock:
 *                 type: integer
 *                 example: 5
 *               specifications:
 *                 type: string
 *                 example: '{"requiresSize":true}'
 *               imageFiles:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
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
 *                 message:
 *                   type: string
 *                   example: "Joya creada y precio calculado correctamente."
 *       400:
 *         description: Validación incorrecta de datos.
 *       500:
 *         description: Error interno del servidor o problemas de configuración del precio del oro.
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  uploadJewelImages,
  asyncHandler(postProduct),
);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags:
 *       - Productos
 *     summary: '[ADMIN] Eliminar una joya'
 *     description: Elimina permanentemente una joya del catálogo por su UUID.
 *     security:
 *       - bearerAuth: []
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
 *                   example: "Producto eliminado correctamente."
 *                 error:
 *                   type: string
 *                   example: "PRODUCT_NOT_FOUND"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(removeProduct),
);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     tags:
 *       - Productos
 *     summary: '[ADMIN] Actualizar una joya existente'
 *     description: Permite modificar cualquier campo de la joya. Si se envían imágenes, las anteriores se borrarán físicamente del servidor. El precio se recalcula automáticamente si cambian los valores base.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la joya a actualizar
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdateInput'
 *     responses:
 *       200:
 *         description: Joya actualizada correctamente.
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
 *                 message:
 *                   type: string
 *                   example: "Joya actualizada y precio recalculado correctamente."
 *       400:
 *         description: Constraint de negocio fallida (ej. excede límite de imágenes).
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Error interno del servidor.
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  uploadJewelImages,
  asyncHandler(putProduct),
);

export default router;
