import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { featuredProductFacade } from '../facade/featured-product.facade';
import {
  CreateFeaturedProductSchema,
  ReorderFeaturedProductsSchema,
} from '../dtos/featured-product.dto';
import { FacadeResult } from '../ports/featured-product.ports';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

/**
 * Envía la respuesta HTTP a partir de un `FacadeResult`, extrayendo el `status`.
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
 * GET /api/featured-products — Lista los productos destacados.
 */
export const getFeaturedProductsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await featuredProductFacade.getFeaturedProducts();
    return handleResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/featured-products — Agrega un producto a los destacados.
 */
export const addFeaturedProductController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = CreateFeaturedProductSchema.parse(req.body);
    const result = await featuredProductFacade.addFeaturedProduct(
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

/**
 * DELETE /api/featured-products/:productId — Quita un producto de los destacados.
 */
export const removeFeaturedProductController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = CreateFeaturedProductSchema.parse({
      productId: req.params.productId,
    });
    const result = await featuredProductFacade.removeFeaturedProduct(
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

/**
 * PUT /api/featured-products/reorder — Reordena la lista de destacados.
 */
export const reorderFeaturedProductsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = ReorderFeaturedProductsSchema.parse(req.body);
    const result = await featuredProductFacade.reorderFeaturedProducts(payload);
    return handleResponse(res, result);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(res, error);
    }
    next(error);
  }
};
