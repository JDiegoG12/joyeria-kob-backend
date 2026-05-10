import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { featuredProductFacade } from '../facade/featured-product.facade';
import {
  CreateFeaturedProductSchema,
  ReorderFeaturedProductsSchema,
} from '../dtos/featured-product.dto';
import { FacadeResult } from '../ports/featured-product.ports';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

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
