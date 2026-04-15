import { FacadeResult } from '../../../shared/types/facade';
import {
  AuthResponseDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
} from '../dtos/auth.dto';
import { User } from '../models/user.model';

export interface IAuthFacade {
  register(data: RegisterRequestDTO): Promise<FacadeResult<User>>;
  login(data: LoginRequestDTO): Promise<FacadeResult<AuthResponseDTO>>;
}
