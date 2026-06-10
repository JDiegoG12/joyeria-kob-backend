import { Request, Response, NextFunction } from 'express';
import { ICategoryFacade, FacadeResult } from '../ports/category.ports';
import { categoryFacade } from '../facade/category.facade';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../dtos/category.dto';
import { ZodError } from 'zod';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

/**
 * Envía la respuesta HTTP a partir de un `FacadeResult`, extrayendo el `status`.
 */
const handleResponse = (res: Response, result: FacadeResult<unknown>) => {
  const { status, ...body } = result;
  return res.status(status).json(body);
};

/**
 * Crea el conjunto de controladores de categorías a partir de una fachada.
 *
 * Recibe la fachada por inyección de dependencias para facilitar las pruebas y
 * el desacoplamiento. Cada controlador traduce la petición HTTP en una llamada a
 * la fachada y delega la respuesta en `handleResponse`.
 *
 * @param facade - Implementación de `ICategoryFacade` a utilizar.
 * @returns Objeto con los controladores de categorías.
 */
export const createCategoryControllers = (facade: ICategoryFacade) => {
  return {
    /** GET /api/categories — Lista todas las categorías. */
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

    /** GET /api/categories/:id — Obtiene una categoría por su ID. */
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

    /** GET /api/categories/:id/children — Lista las subcategorías directas. */
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

    /** POST /api/categories — Crea una categoría (valida el body con Zod). */
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
        next(error); // Delega el resto de errores al manejador global.
      }
    },

    /** PUT /api/categories/:id — Actualiza una categoría (valida el body con Zod). */
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

    /** DELETE /api/categories/:id — Elimina una categoría. */
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
