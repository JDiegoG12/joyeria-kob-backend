import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { IAuthFacade } from '../ports/auth.ports';
import {
  AuthResponseDTO,
  ForgotPasswordRequestDTO,
  GoogleLoginRequestDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
} from '../dtos/auth.dto';
import * as userService from '../services/user.service';
import { FacadeResult } from '../../../shared/types/facade';
import { User } from '@prisma/client';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import {
  buildResetPasswordUrl,
  sendPasswordResetEmail,
} from '../../../shared/email/email.service';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-dev';
const SALT_ROUNDS = 10;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/** Emite un JWT con el mismo payload y vigencia que el resto de la app. */
const issueToken = (user: Pick<User, 'id' | 'role'>): string =>
  jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

/** Hashea (sha256) el token de recuperación para almacenarlo/compararlo en DB. */
const hashResetToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Fachada de autenticación: gestiona el registro, el inicio de sesión
 * (local y Google) y la recuperación de contraseña. Se encarga del hasheo de
 * contraseñas (bcrypt) y de la emisión de tokens JWT, devolviendo siempre un
 * `FacadeResult`.
 */
export class AuthFacade implements IAuthFacade {
  /**
   * Registra un nuevo usuario, hasheando su contraseña y dejando constancia
   * de la aceptación de términos.
   * @param data - Datos de registro.
   * @returns El usuario creado o un error.
   */
  async register(data: RegisterRequestDTO): Promise<FacadeResult<User>> {
    const { name, lastName, email, password, phone } = data;

    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return {
        success: false,
        error: ERROR_CODES.EMAIL_ALREADY_EXISTS,
        message: 'Un usuario con este email ya existe.',
        statusCode: 409,
      };
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await userService.createUser({
      name,
      lastName,
      email,
      password: hashedPassword,
      phone,
      provider: 'local',
      acceptedTermsAt: new Date(),
    });

    return {
      success: true,
      data: newUser,
      message: 'Usuario registrado exitosamente.',
    };
  }

  /**
   * Inicia sesión de un usuario y retorna un token JWT.
   * @param data - Datos de login (email y contraseña).
   * @returns El token y los datos del usuario, o un error.
   */
  async login(data: LoginRequestDTO): Promise<FacadeResult<AuthResponseDTO>> {
    const { email, password } = data;

    const user = await userService.findUserByEmail(email);
    if (!user) {
      return {
        success: false,
        error: ERROR_CODES.USER_NOT_FOUND,
        message: 'El usuario no existe o las credenciales son inválidas.',
        statusCode: 401,
      };
    }

    // Cuenta creada solo con Google: no tiene contraseña local.
    const passwordHash = user.password;
    if (!passwordHash) {
      return {
        success: false,
        error: ERROR_CODES.OAUTH_ACCOUNT_NO_PASSWORD,
        message:
          'Esta cuenta usa inicio de sesión con Google. Ingresa con el botón de Google.',
        statusCode: 401,
      };
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        error: ERROR_CODES.INVALID_PASSWORD,
        message: 'El usuario no existe o las credenciales son inválidas.',
        statusCode: 401,
      };
    }

    const token = issueToken(user);
    const authResponse = new AuthResponseDTO(token, user);

    return {
      success: true,
      data: authResponse,
      message: 'Inicio de sesión exitoso.',
    };
  }

  /**
   * Inicia sesión con Google. Verifica el ID token, y luego:
   * - Si el email ya existe → vincula `googleId` (si falta) e inicia sesión.
   * - Si no existe → crea la cuenta con `provider: "google"`, sin contraseña.
   * @param data - El ID token de Google (`credential`).
   * @returns El token y los datos del usuario, o un error.
   */
  async loginWithGoogle(
    data: GoogleLoginRequestDTO,
  ): Promise<FacadeResult<AuthResponseDTO>> {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: data.credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      payload = undefined;
    }

    if (!payload || !payload.email || !payload.sub) {
      return {
        success: false,
        error: ERROR_CODES.GOOGLE_AUTH_FAILED,
        message: 'No se pudo verificar la sesión de Google.',
        statusCode: 401,
      };
    }

    const email = payload.email;
    const googleId = payload.sub;
    const givenName = payload.given_name ?? '';
    const familyName = payload.family_name ?? '';

    const existingUser = await userService.findUserByEmail(email);

    let user: User;
    if (existingUser) {
      // Vincular googleId si la cuenta local aún no lo tiene.
      if (!existingUser.googleId) {
        user = await userService.updateUserById(existingUser.id, {
          googleId,
          provider:
            existingUser.provider === 'local'
              ? 'local'
              : 'google',
        });
      } else {
        user = existingUser;
      }
    } else {
      user = await userService.createUser({
        name: givenName,
        lastName: familyName,
        email,
        provider: 'google',
        googleId,
        acceptedTermsAt: new Date(),
      });
    }

    const token = issueToken(user);
    const authResponse = new AuthResponseDTO(token, user);

    return {
      success: true,
      data: authResponse,
      message: 'Inicio de sesión con Google exitoso.',
    };
  }

  /**
   * Inicia el flujo de recuperación de contraseña.
   * Por seguridad SIEMPRE responde con éxito y un mensaje genérico, para no
   * revelar si un email está o no registrado (evita enumeración de usuarios).
   * Solo envía el correo si el usuario existe y tiene contraseña local.
   * @param data - El email del usuario.
   */
  async forgotPassword(
    data: ForgotPasswordRequestDTO,
  ): Promise<FacadeResult<null>> {
    const genericResult: FacadeResult<null> = {
      success: true,
      data: null,
      message:
        'Si el correo está registrado, te enviaremos instrucciones para restablecer tu contraseña.',
    };

    const user = await userService.findUserByEmail(data.email);

    // Sin cuenta, o cuenta solo-Google (sin contraseña que restablecer): no se envía.
    if (!user || !user.password) {
      return genericResult;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashResetToken(rawToken);

    await userService.updateUserById(user.id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    try {
      await sendPasswordResetEmail(user.email, buildResetPasswordUrl(rawToken));
    } catch (err) {
      // No revelamos el fallo al cliente; lo registramos para diagnóstico.
      console.error('[forgotPassword] Error al enviar el correo:', err);
    }

    return genericResult;
  }

  /**
   * Restablece la contraseña a partir de un token válido y vigente.
   * Limpia el token tras usarlo (un solo uso).
   * @param data - Token recibido por correo y nueva contraseña.
   */
  async resetPassword(
    data: ResetPasswordRequestDTO,
  ): Promise<FacadeResult<null>> {
    const hashedToken = hashResetToken(data.token);
    const user = await userService.findUserByResetToken(hashedToken);

    if (!user) {
      return {
        success: false,
        error: ERROR_CODES.INVALID_RESET_TOKEN,
        message: 'El enlace de recuperación es inválido o ha expirado.',
        statusCode: 400,
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    await userService.updateUserById(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return {
      success: true,
      data: null,
      message: 'Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.',
    };
  }
}
