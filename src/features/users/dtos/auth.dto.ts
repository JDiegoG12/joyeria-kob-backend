import { User, UserRole } from '@prisma/client';

/**
 * DTO para los datos públicos del usuario, excluyendo la contraseña.
 */
export class UserResponseDTO {
  id: string;
  name: string;
  lastName: string;
  phone: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.lastName = user.lastName;
    this.phone = user.phone ?? null;
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

export interface RegisterRequestDTO {
  name: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UpdateProfileRequestDTO {
  name?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}
export type LoginRequestDTO = Pick<User, 'email' | 'password'>;
