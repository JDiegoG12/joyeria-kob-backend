import { Request, Response } from 'express';
import {
  getAllCategoriesFacade,
  getCategoryByIdFacade,
  createCategoryFacade,
  updateCategoryFacade,
  deleteCategoryFacade,
} from '../facade/category.facade';

/**
 * Retorna todas las categorías del catálogo.
 */
export const getAllCategoriesController = async (
  req: Request,
  res: Response,
) => {
  const result = await getAllCategoriesFacade();
  res.status(result.status).json(result);
};

/**
 * Retorna una categoría específica por su ID.
 */
export const getCategoryByIdController = async (
  req: Request,
  res: Response,
) => {
  const id = Number(req.params['id']);
  const result = await getCategoryByIdFacade(id);
  res.status(result.status).json(result);
};

/**
 * Crea una nueva categoría en el catálogo.
 */
export const postCategoryController = async (req: Request, res: Response) => {
  const { name, slug, description, parentId } = req.body;
  const result = await createCategoryFacade({
    name,
    slug,
    description,
    parentId,
  });
  res.status(result.status).json(result);
};

/**
 * Actualiza una categoría existente.
 */
export const updateCategoryController = async (req: Request, res: Response) => {
  const id = Number(req.params['id']);
  const { name, slug, description, parentId } = req.body;
  const result = await updateCategoryFacade(id, {
    name,
    slug,
    description,
    parentId,
  });
  res.status(result.status).json(result);
};

/**
 * Elimina una categoría del catálogo por su ID.
 */
export const removeCategoryController = async (req: Request, res: Response) => {
  const id = Number(req.params['id']);
  const result = await deleteCategoryFacade(id);
  res.status(result.status).json(result);
};
