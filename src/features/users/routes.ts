import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
} from './controllers/auth.controller';
import { updateProfileController } from './controllers/user.controller';
import {
  registerValidator,
  loginValidator,
  googleLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../../api/middlewares/auth.validator';
import { updateProfileValidator } from '../../api/middlewares/user.validator';
import { authenticateToken } from '../../api/middlewares/auth.middleware';

import { asyncHandler } from '../../shared/utils/async-handler';
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
router.post('/register', registerValidator, asyncHandler(register));

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
router.post('/login', loginValidator, asyncHandler(login));

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Iniciar sesión con Google
 *     description: Verifica el ID token de Google Identity Services. Si el email ya existe, vincula la cuenta; si no, la crea. Devuelve un token JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: ID token (JWT) emitido por Google en el frontend.
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessAuthResponse'
 *       401:
 *         description: No se pudo verificar la sesión de Google.
 */
router.post('/google', googleLoginValidator, asyncHandler(googleLogin));

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un correo con el enlace de restablecimiento. Responde siempre 200 con un mensaje genérico, sin revelar si el email existe.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Solicitud procesada (mensaje genérico).
 */
router.post(
  '/forgot-password',
  forgotPasswordValidator,
  asyncHandler(forgotPassword),
);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Restablecer contraseña
 *     description: Establece una nueva contraseña a partir del token recibido por correo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 'Entre 6 y 50 caracteres.'
 *     responses:
 *       200:
 *         description: Contraseña actualizada.
 *       400:
 *         description: Token inválido o expirado.
 */
router.post(
  '/reset-password',
  resetPasswordValidator,
  asyncHandler(resetPassword),
);

/**
 * @openapi
 * /api/users/me:
 *   put:
 *     tags:
 *       - Usuarios
 *     summary: Actualizar el perfil del usuario autenticado
 *     description: Permite al usuario actualmente logueado actualizar sus datos personales, incluyendo su contraseña. Todos los campos son opcionales.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Juanito'
 *               lastName:
 *                 type: string
 *                 example: 'Pérez G'
 *               phone:
 *                 type: string
 *                 example: '3119876543'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'juan.perez@newemail.com'
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: 'Requerido solo si se va a cambiar la contraseña.'
 *                 example: 'Cliente123!'
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: 'La nueva contraseña. Debe tener entre 6 y 50 caracteres.'
 *                 example: 'NuevaClaveSegura456!'
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessUserResponse'
 *       400:
 *         description: Error de validación o contraseña actual incorrecta.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: El email ya está en uso por otro usuario.
 */
router.put(
  '/me',
  authenticateToken,
  updateProfileValidator,
  asyncHandler(updateProfileController),
);

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
