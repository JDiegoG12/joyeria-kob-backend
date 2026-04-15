import { PrismaClient } from '@prisma/client';
import { RegisterRequestDTO } from '../dtos/auth.dto';
import { User } from '../models/user.model';

const prisma = new PrismaClient();

/**
 * Busca un usuario por su dirección de email.
 * @param email - El email del usuario.
 * @returns El usuario encontrado o null.
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Crea un nuevo usuario en la base de datos.
 * @param userData - Los datos del usuario para el registro.
 * @returns El usuario recién creado.
 */
export const createUser = async (
  userData: RegisterRequestDTO,
): Promise<User> => {
  return prisma.user.create({
    data: userData,
  });
};
