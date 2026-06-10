import { Response } from 'express';
import { AuthenticatedRequest } from '../../../api/middlewares/auth.middleware';
import { UserFacade } from '../facade/user.facade';
import { UserResponseDTO } from '../dtos/auth.dto';

const userFacade = new UserFacade();

/**
 * PUT /api/users/me — Actualiza el perfil del usuario autenticado.
 *
 * El ID se toma del token JWT (no del body), de modo que un usuario solo puede
 * actualizar su propio perfil. La respuesta excluye la contraseña.
 */
export const updateProfileController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  // El ID del usuario se obtiene del token JWT, garantizando que solo pueda actualizar su propio perfil.
  const userId = req.user!.id;
  const updateData = req.body;

  const result = await userFacade.updateProfile(userId, updateData);

  if (!result.success) {
    return res.status(result.statusCode!).json({
      success: false,
      error: result.error,
      message: result.message,
    });
  }

  // Devuelve los datos actualizados del usuario, excluyendo la contraseña.
  return res.status(200).json({
    success: true,
    data: new UserResponseDTO(result.data!),
    message: result.message,
  });
};
