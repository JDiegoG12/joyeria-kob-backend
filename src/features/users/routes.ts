import { Router } from 'express';
import { register, login } from './controllers/auth.controller';
import {
  registerValidator,
  loginValidator,
} from '../../api/middlewares/auth.validator';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registrar un nuevo usuario
 *     description: Crea una nueva cuenta de usuario con rol de CLIENTE por defecto.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del cliente.
 *                 example: 'Juan'
 *               lastName:
 *                 type: string
 *                 description: Apellido del cliente.
 *                 example: 'Pérez'
 *               phone:
 *                 type: string
 *                 description: Teléfono de contacto del cliente (opcional).
 *                 example: '3101234567'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'cliente@test.com'
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 'Debe tener entre 6 y 50 caracteres.'
 *                 example: 'Cliente123!'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessUserResponse'
 *       400:
 *         description: Error de validación (ej. campos faltantes, contraseña inválida).
 *       409:
 *         description: El email ya está en uso.
 */
router.post('/register', registerValidator, register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Iniciar sesión
 *     description: Autentica a un usuario y devuelve un token JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'admin@kob.com'
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 'Admin123!'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessAuthResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/login', loginValidator, login);

/**
 * @openapi
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
 *         name:
 *           type: string
 *           example: 'Juan'
 *         lastName:
 *           type: string
 *           example: 'Pérez'
 *         phone:
 *           type: string
 *           example: '3101234567'
 *         email:
 *           type: string
 *           format: email
 *           example: 'cliente@test.com'
 *         role:
 *           type: string
 *           enum: [CLIENT, ADMIN]
 *           example: 'CLIENT'
 *         createdAt:
 *           type: string
 *           format: date-time
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 *     SuccessUserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/UserResponse'
 *         message:
 *           type: string
 *           example: 'Usuario registrado exitosamente.'
 *     SuccessAuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/AuthResponse'
 *         message:
 *           type: string
 *           example: 'Inicio de sesión exitoso.'
 */

export default router;
