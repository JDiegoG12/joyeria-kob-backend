import { FacadeResult } from '../../../shared/types/facade';
import {
  AuthResponseDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
} from '../dtos/auth.dto';
import { User } from '@prisma/client';

/** Contrato de la fachada de autenticación. */
export interface IAuthFacade {
  /** Registra un nuevo usuario con la contraseña hasheada. */
  register(data: RegisterRequestDTO): Promise<FacadeResult<User>>;
  /** Inicia sesión y devuelve un token JWT junto con los datos del usuario. */
  login(data: LoginRequestDTO): Promise<FacadeResult<AuthResponseDTO>>;
}
