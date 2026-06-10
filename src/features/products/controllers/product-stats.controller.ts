import { Response } from 'express';
import { AuthenticatedRequest } from '../../../api/middlewares/auth.middleware';
import { ProductStatsFacade } from '../facade/product-stats.facade';
import { StatsQueryDTO } from '../dtos/product-stats.dto';
import { ProductStatus } from '@prisma/client';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

const statsFacade = new ProductStatsFacade();
const DEFAULT_TOP_FAVORITES_LIMIT = 10;
const MAX_TOP_FAVORITES_LIMIT = 50;

/**
 * Controlador para manejar las peticiones de estadísticas de productos.
 * Valida los parámetros de consulta, extrae la información del usuario del token,
 * y delega la lógica de negocio a la ProductStatsFacade.
 */
export const getProductStatsController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  // El middleware ahora es opcional, por lo que req.user puede no existir.
  const user = req.user;
  const { agrupar, estado, categoryId } = req.query;

  // Construye un DTO de consulta validado
  const query: StatsQueryDTO = {};
  if (agrupar === 'categoria' || agrupar === 'estado') {
    query.agrupar = agrupar;
  }
  if (
    estado &&
    Object.values(ProductStatus).includes(estado as ProductStatus)
  ) {
    query.estado = estado as ProductStatus;
  }
  // Parse categoryId to number if present
  if (categoryId) {
    const parsedCategoryId = Number(categoryId);
    if (!isNaN(parsedCategoryId)) {
      query.categoryId = parsedCategoryId;
    } else {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'El parámetro categoryId debe ser un número válido.',
      });
    }
  }

  const result = await statsFacade.getStats(user, query);

  if (!result.success) {
    return res.status(result.statusCode!).json({
      success: false,
      error: result.error,
      message: result.message,
    });
  }

  return res.status(200).json({
    // Usar el statusCode de la fachada
    success: true,
    data: result.data,
    message: result.message,
  });
};

/**
 * Controlador para obtener el top de productos con mas favoritos.
 */
export const getTopFavoriteProductsController = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const user = req.user;
  let limit = DEFAULT_TOP_FAVORITES_LIMIT;

  if (req.query.limit !== undefined) {
    const parsedLimit = Number(req.query.limit);
    if (
      !Number.isFinite(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > MAX_TOP_FAVORITES_LIMIT
    ) {
      return res.status(400).json({
        success: false,
        error: ERROR_CODES.VALIDATION_ERROR,
        message: `El parametro limit debe estar entre 1 y ${MAX_TOP_FAVORITES_LIMIT}.`,
      });
    }
    limit = Math.trunc(parsedLimit);
  }

  const result = await statsFacade.getTopFavoriteProducts(user, limit);

  if (!result.success) {
    return res.status(result.statusCode!).json({
      success: false,
      error: result.error,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data,
    message: result.message,
  });
};
