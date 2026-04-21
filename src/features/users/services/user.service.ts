import { prisma } from '../../../config/prisma';
import { Prisma } from '@prisma/client';
import { User } from '@prisma/client';

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
 * @param userData - Los datos del usuario para el registro, con la contraseña ya hasheada.
 * @returns El usuario recién creado.
 */
export const createUser = async (
  userData: Prisma.UserCreateInput,
): Promise<User> => {
  return prisma.user.create({
    data: userData,
  });
};
