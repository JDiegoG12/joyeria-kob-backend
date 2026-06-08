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
import path from 'path';
import cors from 'cors';
/**
 * Instancia principal de la aplicación Express para la Joyería KOB.
 */
const app: Application = express();
//esto es pa que el cors del frontend no de problemas
// Orígenes permitidos: con y sin www
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : [];

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
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// --- MANEJO DE ERRORES ---
// Este DEBE ser el último middleware que se registra para atrapar errores
// de todas las rutas y middlewares anteriores.
app.use(globalErrorHandler);

export default app;
