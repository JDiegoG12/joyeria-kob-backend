import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAuthFacade } from '../ports/auth.ports';
import {
  AuthResponseDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
} from '../dtos/auth.dto';
import * as userService from '../services/user.service';
import { FacadeResult } from '../../../shared/types/facade';
import { User } from '../models/user.model';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-dev';
const SALT_ROUNDS = 10;

export class AuthFacade implements IAuthFacade {
  /**
   * Registra un nuevo usuario, hasheando su contraseña.
   * @param data - Datos de registro (email y contraseña).
   * @returns El usuario creado o un error.
   */
  async register(data: RegisterRequestDTO): Promise<FacadeResult<User>> {
    const { email, password } = data;

    if (!email || !password) {
      return {
        success: false,
        error: ERROR_CODES.VALIDATION_ERROR,
        message: 'Email y contraseña son requeridos.',
        statusCode: 400,
      };
    }

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
      email,
      password: hashedPassword,
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

    if (!email || !password) {
      return {
        success: false,
        error: ERROR_CODES.VALIDATION_ERROR,
        message: 'Email y contraseña son requeridos.',
        statusCode: 400,
      };
    }

    const user = await userService.findUserByEmail(email);
    if (!user) {
      return {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED,
        message: 'Credenciales inválidas.',
        statusCode: 401,
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED,
        message: 'Credenciales inválidas.',
        statusCode: 401,
      };
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '1d',
    });

    const authResponse = new AuthResponseDTO(token, user);

    return {
      success: true,
      data: authResponse,
      message: 'Inicio de sesión exitoso.',
    };
  }
}
