import { Request, Response } from 'express';
import { AuthFacade } from '../facade/auth.facade';
import {
  ForgotPasswordRequestDTO,
  GoogleLoginRequestDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
  UserResponseDTO,
} from '../dtos/auth.dto';

const authFacade = new AuthFacade();

/**
 * @controller POST /api/auth/register
 * @description Registra un nuevo usuario.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @returns Una respuesta JSON.
 */
export const register = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const registerData: RegisterRequestDTO = req.body;
  const result = await authFacade.register(registerData);

  if (!result.success) {
    return res.status(result.statusCode).json({
      success: false,
      error: result.error,
      message: result.message,
    });
  }

  const userDTO = new UserResponseDTO(result.data);

  return res.status(201).json({
    success: true,
    data: userDTO,
    message: result.message,
  });
};

/**
 * @controller POST /api/auth/login
 * @description Inicia sesión de un usuario y retorna un token JWT.
 * @param req La petición de Express.
 * @param res La respuesta de Express.
 * @returns Una respuesta JSON.
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
  const loginData: LoginRequestDTO = req.body;
  const result = await authFacade.login(loginData);

  if (!result.success) {
    return res.status(result.statusCode).json({
      success: false,
      error: result.error,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data,
    message: result.message,
  });
};

/**
 * @controller POST /api/auth/google
 * @description Inicia sesión (o registra y vincula) con un ID token de Google.
 */
export const googleLogin = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const googleData: GoogleLoginRequestDTO = req.body;
  const result = await authFacade.loginWithGoogle(googleData);

  if (!result.success) {
    return res.status(result.statusCode).json({
      success: false,
      error: result.error,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data,
    message: result.message,
  });
};

/**
 * @controller POST /api/auth/forgot-password
 * @description Inicia el flujo de recuperación de contraseña. Responde siempre
 * 200 con un mensaje genérico para no revelar si el email existe.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const data: ForgotPasswordRequestDTO = req.body;
  const result = await authFacade.forgotPassword(data);

  // forgotPassword siempre devuelve éxito por diseño.
  return res.status(200).json({
    success: true,
    message: result.success ? result.message : undefined,
  });
};

/**
 * @controller POST /api/auth/reset-password
 * @description Restablece la contraseña a partir del token recibido por correo.
 */
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const data: ResetPasswordRequestDTO = req.body;
  const result = await authFacade.resetPassword(data);

  if (!result.success) {
    return res.status(result.statusCode).json({
      success: false,
      error: result.error,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
  });
};
