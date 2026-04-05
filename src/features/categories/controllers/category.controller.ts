import { Request, Response } from 'express';
import { ICategoryFacade } from '../ports/category.ports';
import { categoryFacade } from '../facade/category.facade';

/**
 * Crea los controladores para el feature de categorías, inyectando una implementación
 * del facade. Esto permite que los controladores dependan de una abstracción (ICategoryFacade)
 * y no de una implementación concreta, facilitando el testing y el mantenimiento.
 *
 * @param facade - Una instancia que cumple con la interfaz ICategoryFacade.
 * @returns Un objeto con todos los métodos del controlador.
 */
export const createCategoryControllers = (facade: ICategoryFacade) => {
  return {
    /**
     * Retorna todas las categorías del catálogo.
     */
    getAllCategoriesController: async (req: Request, res: Response) => {
      const result = await facade.getAllCategories();
      res.status(result.status).json(result);
    },

    /**
     * Retorna una categoría específica por su ID.
     */
    getCategoryByIdController: async (req: Request, res: Response) => {
      const id = Number(req.params['id']);
      const result = await facade.getCategoryById(id);
      res.status(result.status).json(result);
    },

    /**
     * Retorna las subcategorías directas de una categoría.
     */
    getCategoryChildrenController: async (req: Request, res: Response) => {
      const id = Number(req.params['id']);
      const result = await facade.getCategoryChildren(id);
      res.status(result.status).json(result);
    },

    /**
     * Crea una nueva categoría en el catálogo.
     */
    postCategoryController: async (req: Request, res: Response) => {
      const { name, slug, description, parentId } = req.body;
      const result = await facade.createCategory({
        name,
        slug,
        description,
        parentId,
      });
      res.status(result.status).json(result);
    },

    /**
     * Actualiza una categoría existente.
     */
    updateCategoryController: async (req: Request, res: Response) => {
      const id = Number(req.params['id']);
      const { name, slug, description, parentId } = req.body;
      const result = await facade.updateCategory(id, {
        name,
        slug,
        description,
        parentId,
      });
      res.status(result.status).json(result);
    },

    /**
     * Elimina una categoría del catálogo por su ID.
     */
    removeCategoryController: async (req: Request, res: Response) => {
      const id = Number(req.params['id']);
      const result = await facade.deleteCategory(id);
      res.status(result.status).json(result);
    },
  };
};

/**
 * Exporta una instancia de los controladores ya inyectados con el facade por defecto.
 */
export const {
  getAllCategoriesController,
  getCategoryByIdController,
  getCategoryChildrenController,
  postCategoryController,
  updateCategoryController,
  removeCategoryController,
} = createCategoryControllers(categoryFacade);
