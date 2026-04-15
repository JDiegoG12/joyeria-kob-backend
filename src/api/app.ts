import express, { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.config';
import productRouter from '../features/products/routes';
import authRouter from '../features/users/routes';
import adminRouter from '../features/admin/routes';
import categoryRouter from '../features/categories/routes';
import { errorHandler } from './middlewares/error.middleware';
import path from 'path';
import cors from 'cors';
/**
 * Instancia principal de la aplicación Express para la Joyería KOB.
 */
const app: Application = express();
//esto es pa que el cors del frontend no de problemas
app.use(
  cors({
    origin: 'http://localhost:5173',
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

app.use(errorHandler);
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
export default app;
