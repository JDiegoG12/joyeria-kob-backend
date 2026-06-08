import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../api/middlewares/auth.middleware';
import { CustomerFacade } from '../facade/customer.facade';

const customerFacade = new CustomerFacade();

/**
 * Extrae un número opcional de un valor de `req.query`.
 * Devuelve `undefined` si el valor es ausente, vacío o no numérico.
 */
const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Extrae una cadena de búsqueda opcional de `req.query`.
 * Devuelve `undefined` si el valor no es string o está vacío.
 */
const parseOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  return value;
};

/**
 * GET /api/users  (admin)
 * Devuelve el listado paginado de clientes con búsqueda opcional.
 */
export const getCustomersController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseOptionalNumber(req.query.page);
    const limit = parseOptionalNumber(req.query.limit);
    const search = parseOptionalString(req.query.search);

    const result = await customerFacade.getCustomers(page, limit, search);

    if (!result.success) {
      res.status(result.statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id/favorites  (admin)
 * Devuelve todos los favoritos de un cliente específico.
 */
export const getCustomerFavoritesController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const result = await customerFacade.getCustomerFavorites(id);

    if (!result.success) {
      res.status(result.statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
