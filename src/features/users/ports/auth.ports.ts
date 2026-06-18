import { FacadeResult } from '../../../shared/types/facade';
import {
  AuthResponseDTO,
  ForgotPasswordRequestDTO,
  GoogleLoginRequestDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
} from '../dtos/auth.dto';
import { User } from '@prisma/client';

/** Contrato de la fachada de autenticación. */
export interface IAuthFacade {
  /** Registra un nuevo usuario con la contraseña hasheada. */
  register(data: RegisterRequestDTO): Promise<FacadeResult<User>>;
  /** Inicia sesión y devuelve un token JWT junto con los datos del usuario. */
  login(data: LoginRequestDTO): Promise<FacadeResult<AuthResponseDTO>>;
  /**
   * Inicia sesión (o registra y vincula) con un ID token de Google.
   * Devuelve el mismo shape que `login`.
   */
  loginWithGoogle(
    data: GoogleLoginRequestDTO,
  ): Promise<FacadeResult<AuthResponseDTO>>;
  /**
   * Inicia el flujo de recuperación de contraseña. Por seguridad responde
   * siempre con éxito (sin revelar si el email existe).
   */
  forgotPassword(
    data: ForgotPasswordRequestDTO,
  ): Promise<FacadeResult<null>>;
  /** Restablece la contraseña a partir de un token válido y no expirado. */
  resetPassword(
    data: ResetPasswordRequestDTO,
  ): Promise<FacadeResult<null>>;
}
