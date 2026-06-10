import { Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { favoriteFacade } from '../facade/favorite.facade';
import { FavoriteProductIdSchema } from '../dtos/favorite.dto';
import { FacadeResult } from '../ports/favorite.ports';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { AuthenticatedRequest } from '../../../api/middlewares/auth.middleware';

/**
 * Envía la respuesta HTTP a partir de un `FacadeResult`, extrayendo el `status`
 * y serializando el resto del cuerpo como JSON.
 */
const handleResponse = (res: Response, result: FacadeResult<unknown>) => {
  const { status, ...body } = result;
  return res.status(status).json(body);
};

/**
 * Responde con un 400 estandarizado a partir de un error de validación de Zod.
 */
const handleValidationError = (res: Response, error: ZodError) => {
  return res.status(400).json({
    success: false,
    error: ERROR_CODES.VALIDATION_ERROR,
    message: 'Error de validacion en los datos de entrada.',
    details: error.issues,
  });
};

/**
 * Obtiene el ID del usuario autenticado desde la petición.
 * Si no existe, responde con un 401 y devuelve `null` para cortar el flujo.
 *
 * @returns El ID del usuario o `null` si no está autenticado.
 */
const getUserIdOrRespond = (
  req: AuthenticatedRequest,
  res: Response,
): string | null => {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      error: ERROR_CODES.UNAUTHORIZED,
      message: 'Acceso denegado. Token invalido.',
    });
    return null;
  }
  return req.user.id;
};

/**
 * GET /api/favorites — Devuelve los favoritos del usuario autenticado.
 */
export const getFavoritesController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserIdOrRespond(req, res);
    if (!userId) return;

    const result = await favoriteFacade.getUserFavorites(userId);
    return handleResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/favorites — Agrega a favoritos el producto indicado en el cuerpo.
 */
export const addFavoriteController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserIdOrRespond(req, res);
    if (!userId) return;

    const payload = FavoriteProductIdSchema.parse(req.body);
    const result = await favoriteFacade.addFavorite(userId, payload.productId);
    return handleResponse(res, result);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(res, error);
    }
    next(error);
  }
};

/**
 * DELETE /api/favorites/:productId — Quita de favoritos el producto indicado.
 */
export const removeFavoriteController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = getUserIdOrRespond(req, res);
    if (!userId) return;

    const payload = FavoriteProductIdSchema.parse({
      productId: req.params.productId,
    });
    const result = await favoriteFacade.removeFavorite(
      userId,
      payload.productId,
    );
    return handleResponse(res, result);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(res, error);
    }
    next(error);
  }
};
