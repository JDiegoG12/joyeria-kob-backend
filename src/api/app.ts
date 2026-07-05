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
import helmet from 'helmet';
import compression from 'compression';
import renderRouter from '../features/render/routes';
import { getSitemap } from '../features/sitemap/sitemap.controller';
import { getGoogleFeed } from '../features/google-feed/google-feed.controller';
import { asyncHandler } from '../shared/utils/async-handler';
/**
 * Instancia principal de la aplicación Express para la Joyería KOB.
 */
const app: Application = express();

// --- PROXY INVERSO ---
// En producción la app corre detrás del proxy de Apache/Hostinger. Sin esto,
// Express ve siempre la IP del proxy como IP del cliente, lo que rompería el
// rate limiting (todas las peticiones contarían como una sola IP). Confiamos en
// un único salto de proxy.
app.set('trust proxy', 1);

// --- CABECERAS DE SEGURIDAD (helmet) ---
// Añade cabeceras HTTP de seguridad: HSTS, X-Content-Type-Options: nosniff,
// X-Frame-Options: DENY, Referrer-Policy, etc. Dos ajustes sobre los valores
// por defecto:
//  - `crossOriginResourcePolicy: cross-origin`: sin esto helmet pondría
//    `Cross-Origin-Resource-Policy: same-origin` y el frontend (otro origen) no
//    podría cargar las imágenes servidas en /uploads.
//  - `contentSecurityPolicy: false`: la CSP relevante para el navegador vive en
//    el frontend (.htaccess). La CSP por defecto de helmet rompería Swagger UI
//    (scripts/estilos inline) y no aporta valor en una API que responde JSON.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
);

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
      // Se permiten peticiones sin `Origin` (curl, health checks/monitores,
      // apps móviles, SSR). CORS solo protege al navegador, y como la
      // autenticación viaja en el header `Authorization: Bearer` (no en cookies
      // de sesión), no hay credenciales ambientales que un tercero pueda abusar
      // desde otro origen. El navegador, en cambio, SÍ queda restringido a la
      // lista blanca de abajo.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
      }
    },
    // `credentials: false`: la API no usa cookies (el JWT va en el header
    // Authorization), así que no se permite el envío de credenciales
    // cross-origin. Esto elimina la combinación riesgosa `credentials:true` +
    // orígenes laxos que podría habilitar CSRF si en el futuro se añadieran
    // cookies sin protección. Si algún día se migra el token a cookie httpOnly,
    // habrá que volver a poner `true` y añadir protección CSRF.
    credentials: false,
  }),
);
// Middlewares base para entender JSON. Se limita el tamaño del body para evitar
// un DoS por payloads gigantes (agotamiento de memoria/CPU al parsear). La API
// solo recibe JSON pequeño; las imágenes van por multipart/form-data (multer).
app.use(express.json({ limit: '100kb' }));

// Documentación Swagger en /api-docs. Solo se expone fuera de producción: en
// producción publicaría el mapa completo de endpoints y esquemas, facilitando
// el reconocimiento a un atacante. Para habilitarla en un entorno concreto,
// basta con no marcar NODE_ENV=production.
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// --- SITEMAP DINÁMICO (SEO) ---
// Generado desde la BD (productos no ocultos) + páginas estáticas, con sitemap
// de imágenes. Se sirve en la raíz (/sitemap.xml) como espera robots.txt.
app.get('/sitemap.xml', asyncHandler(getSitemap));

// --- FEED DE PRODUCTOS PARA GOOGLE (Merchant Center) ---
// RSS 2.0 generado desde la BD (solo productos AVAILABLE) con precios calculados
// en vivo, para que coincidan con el JSON-LD y la landing. Se sirve en la raíz.
app.get('/google-feed.xml', asyncHandler(getGoogleFeed));

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
