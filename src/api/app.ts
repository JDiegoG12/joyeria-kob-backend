import express, { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.config';
import productRouter from '../features/products/routes';
import authRouter from '../features/users/routes';
import customerRouter from '../features/users/customer.routes';
import adminRouter from '../features/admin/routes';
import systemRouter from '../features/system/routes';
import categoryRouter from '../features/categories/routes';
import bannerRouter from '../features/banners/routes';
import featuredProductRouter from '../features/featured-products/routes';
import socialContentRouter from '../features/social-content/routes';
import promoBannerRouter from '../features/promo-banners/routes';
import favoriteRouter from '../features/favorites/routes';
import { globalErrorHandler } from './middlewares/error-handler.middleware';
import { thumbnailOnDemand } from './middlewares/thumbnail.middleware';
import { UPLOADS_PATH } from '../config/paths.config';
import cors from 'cors';
import compression from 'compression';
import renderRouter from '../features/render/routes';
import { getSitemap } from '../features/sitemap/sitemap.controller';
import { asyncHandler } from '../shared/utils/async-handler';
/**
 * Instancia principal de la aplicación Express para la Joyería KOB.
 */
const app: Application = express();

// --- COMPRESIÓN (gzip) ---
// Comprime las respuestas (principalmente el JSON de la API y el HTML de
// /render) para reducir el peso transferido. La auditoría SEO detectó que no
// existía compresión. Se registra antes que cualquier ruta para que envuelva
// todas las respuestas. `compression` respeta el header `Accept-Encoding` del
// cliente y omite la compresión de los archivos ya comprimidos de /uploads
// (imágenes), por lo que es seguro dejarlo global.
app.use(compression());

// --- CONFIGURACIÓN DE CORS ---
// Orígenes permitidos leídos desde las variables de entorno.
const frontendOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : [];

// Añadimos la URL del propio backend para permitir peticiones desde Swagger UI.
const selfOrigin =
  process.env.APP_URL || `http://localhost:${process.env.PORT || 4000}`;
const allowedOrigins = [...frontendOrigins, selfOrigin];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite llamadas sin origin (Postman, mobile apps, SSR)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
      }
    },
    credentials: true,
  }),
);
// Middlewares base para entender JSON
app.use(express.json());

// Documentación Swagger en /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- SITEMAP DINÁMICO (SEO) ---
// Generado desde la BD (productos no ocultos) + páginas estáticas, con sitemap
// de imágenes. Se sirve en la raíz (/sitemap.xml) como espera robots.txt.
app.get('/sitemap.xml', asyncHandler(getSitemap));

// Rutas de la API
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/system', systemRouter);
app.use('/api/users', authRouter); // Para /users/me
app.use('/api/users', customerRouter); // Endpoints admin de clientes (GET /, /:id/favorites)
app.use('/api/banner', bannerRouter);
app.use('/api/featured-products', featuredProductRouter);
app.use('/api/social-contents', socialContentRouter);
app.use('/api/promo-banners', promoBannerRouter);
app.use('/api/favorites', favoriteRouter);

// --- DYNAMIC RENDERING PARA BOTS (SEO) ---
// HTML completo y pre-renderizado de las páginas públicas equivalentes a las
// del frontend (home, catálogo, detalle de producto). Apache (del lado del
// frontend) enruta hacia aquí solo cuando detecta un user-agent de crawler.
// Estas rutas NO dependen de cookies/sesión y se sirven igual sea por redirect
// 302 o por proxy reverso desde Apache. Ver src/features/render.
app.use('/render', renderRouter);

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Estado
 *     summary: Healthcheck de la API
 *     description: Verifica que el servidor está activo y respondiendo correctamente.
 *     responses:
 *       200:
 *         description: API funcionando correctamente.
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
 *                   example: API de Joyería KOB funcionando correctamente
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API de Joyería KOB funcionando correctamente 💎',
  });
});

// Middleware para servir archivos estáticos (imágenes)
// La URL pública sigue siendo /uploads, pero el origen físico ahora es dinámico
// y se lee desde nuestra configuración centralizada.
//
// `thumbnailOnDemand` va ANTES de express.static: genera la miniatura
// (`uuid-thumb.webp`) si aún no existe y deja que express.static la sirva. Las
// imágenes se nombran con UUID (una subida nueva = archivo nuevo), así que es
// seguro cachearlas de forma agresiva en el navegador/CDN.
app.use(
  '/uploads',
  thumbnailOnDemand,
  express.static(UPLOADS_PATH, { maxAge: '30d' }),
);

// --- MANEJO DE ERRORES ---
// Este DEBE ser el último middleware que se registra para atrapar errores
// de todas las rutas y middlewares anteriores.
app.use(globalErrorHandler);

export default app;
