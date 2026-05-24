import { Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { favoriteFacade } from '../facade/favorite.facade';
import { FavoriteProductIdSchema } from '../dtos/favorite.dto';
import { FacadeResult } from '../ports/favorite.ports';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { AuthenticatedRequest } from '../../../api/middlewares/auth.middleware';

const handleResponse = (res: Response, result: FacadeResult<unknown>) => {
  const { status, ...body } = result;
  return res.status(status).json(body);
};

const handleValidationError = (res: Response, error: ZodError) => {
  return res.status(400).json({
    success: false,
    error: ERROR_CODES.VALIDATION_ERROR,
    message: 'Error de validacion en los datos de entrada.',
    details: error.issues,
  });
};

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
