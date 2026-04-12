import { Request, Response, NextFunction } from 'express';
import { ICategoryFacade, FacadeResult } from '../ports/category.ports';
import { categoryFacade } from '../facade/category.facade';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../dtos/category.dto';
import { ZodError } from 'zod';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

const handleResponse = (res: Response, result: FacadeResult<unknown>) => {
  const { status, ...body } = result;
  return res.status(status).json(body);
};

export const createCategoryControllers = (facade: ICategoryFacade) => {
  return {
    getAllCategoriesController: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await facade.getAllCategories();
        handleResponse(res, result);
      } catch (error) {
        next(error);
      }
    },

    getCategoryByIdController: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const id = Number(req.params['id']);
        const result = await facade.getCategoryById(id);
        handleResponse(res, result);
      } catch (error) {
        next(error);
      }
    },

    getCategoryChildrenController: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const id = Number(req.params['id']);
        const result = await facade.getCategoryChildren(id);
        handleResponse(res, result);
      } catch (error) {
        next(error);
      }
    },

    postCategoryController: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const categoryData = CreateCategorySchema.parse(req.body);
        const result = await facade.createCategory(categoryData);

        const response = {
          success: result.success,
          message:
            result.message ||
            (result.success
              ? 'Categoría creada correctamente.'
              : 'Error al crear la categoría.'),
          ...(result.success ? { data: result.data } : { error: result.error }),
        };

        res.status(result.status).json(response);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            success: false,
            error: ERROR_CODES.VALIDATION_ERROR,
            message: 'Error de validación en los datos de entrada.',
            details: error.issues,
          });
        }
        next(error); // Forward other errors to the global error handler
      }
    },

    updateCategoryController: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const id = Number(req.params['id']);
        const categoryData = UpdateCategorySchema.parse(req.body);
        const result = await facade.updateCategory(id, categoryData);

        const response = {
          success: result.success,
          message:
            result.message ||
            (result.success
              ? 'Categoría actualizada correctamente.'
              : 'Error al actualizar la categoría.'),
          ...(result.success ? { data: result.data } : { error: result.error }),
        };

        res.status(result.status).json(response);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            success: false,
            error: ERROR_CODES.VALIDATION_ERROR,
            message: 'Error de validación en los datos de entrada.',
            details: error.issues,
          });
        }
        next(error);
      }
    },

    removeCategoryController: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const id = Number(req.params['id']);
        const result = await facade.deleteCategory(id);
        const response = {
          success: result.success,
          message:
            result.message ||
            (result.success
              ? 'Categoría eliminada correctamente.'
              : 'Error al eliminar la categoría.'),
          ...(result.success ? { data: result.data } : { error: result.error }),
        };

        res.status(result.status).json(response);
      } catch (error) {
        next(error);
      }
    },
  };
};

export const {
  getAllCategoriesController,
  getCategoryByIdController,
  getCategoryChildrenController,
  postCategoryController,
  updateCategoryController,
  removeCategoryController,
} = createCategoryControllers(categoryFacade);
