import { Request, Response } from 'express';
import { AuthFacade } from '../facade/auth.facade';
import {
  LoginRequestDTO,
  RegisterRequestDTO,
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
