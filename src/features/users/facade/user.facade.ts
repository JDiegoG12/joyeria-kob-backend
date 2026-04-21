import bcrypt from 'bcryptjs';
import { FacadeResult } from '../../../shared/types/facade';
import { Prisma, User } from '@prisma/client';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import * as userService from '../services/user.service';
import { UpdateProfileRequestDTO } from '../dtos/auth.dto';

const SALT_ROUNDS = 10;

export class UserFacade {
  async updateProfile(
    userId: string,
    data: UpdateProfileRequestDTO,
  ): Promise<FacadeResult<User>> {
    const { name, lastName, phone, email, currentPassword, newPassword } = data;

    const user = await userService.findUserById(userId);
    if (!user) {
      // Este caso es improbable si el token es válido, pero es una buena salvaguarda.
      return {
        success: false,
        error: ERROR_CODES.USER_NOT_FOUND,
        message: 'Usuario no encontrado.',
        statusCode: 404,
      };
    }

    const dataToUpdate: Prisma.UserUpdateInput = {};

    // Construye dinámicamente el objeto de actualización.
    if (name) dataToUpdate.name = name;
    if (lastName) dataToUpdate.lastName = lastName;
    if (phone !== undefined) dataToUpdate.phone = phone; // Permite establecer el teléfono a "" o null.
    if (email) dataToUpdate.email = email;

    // Lógica para el cambio de contraseña.
    if (newPassword && currentPassword) {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        return {
          success: false,
          error: ERROR_CODES.INVALID_PASSWORD,
          message: 'Datos incorrectos para actualizar el perfil.',
          statusCode: 400,
        };
      }
      dataToUpdate.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }

    // Si no se envió ningún dato válido para actualizar, devuelve un error.
    if (Object.keys(dataToUpdate).length === 0) {
      return {
        success: false,
        error: ERROR_CODES.VALIDATION_ERROR,
        message: 'No se proporcionaron datos para actualizar.',
        statusCode: 400,
      };
    }

    const updatedUser = await userService.updateUserById(userId, dataToUpdate);

    return {
      success: true,
      data: updatedUser,
      message: 'Perfil actualizado correctamente.',
    };
  }
}
