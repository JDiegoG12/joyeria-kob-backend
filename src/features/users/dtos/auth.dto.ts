import { User, UserRole } from '../models/user.model';

/**
 * DTO para los datos públicos del usuario, excluyendo la contraseña.
 */
export class UserResponseDTO {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.role = user.role;
    this.createdAt = user.createdAt;
  }
}

/**
 * DTO para la respuesta de autenticación, incluyendo el token y los datos del usuario.
 */
export class AuthResponseDTO {
  token: string;
  user: UserResponseDTO;

  constructor(token: string, user: User) {
    this.token = token;
    this.user = new UserResponseDTO(user);
  }
}

export type RegisterRequestDTO = Pick<User, 'email' | 'password'>;
export type LoginRequestDTO = Pick<User, 'email' | 'password'>;
