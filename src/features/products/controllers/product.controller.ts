import { Request, Response, NextFunction } from 'express';
import { productFacade } from '../facade/product.facade';

/**
 * Obtiene todos los productos del catálogo.
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Si la URL tiene un query ?admin=true, lo interpretamos como que el usuario es admin y le mostramos todo el catálogo, incluyendo los ocultos. Si no, solo mostramos los disponibles.
    const isAdmin = req.query.admin === 'true';
    const categoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : undefined;
    const result = await productFacade.getProducts(isAdmin, categoryId);


    res.status(result.status).json({
      success: result.success,
      data: result.data,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un producto específico.
 */
export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await productFacade.getProduct(id);

    res.status(result.status).json({
      success: result.success,
      data: result.data,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una nueva joya en el sistema.
 */
export const postProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const productData = req.body;
    // Capturamos los archivos de imagen inyectados por el middleware de Multer
    const files = req.files as Express.Multer.File[];

    const result = await productFacade.createProduct(productData, files);

    res.status(result.status).json({
      success: result.success,
      data: result.data,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina un producto permanentemente.
 */
export const removeProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await productFacade.deleteProduct(id);

    res.status(result.status).json({
      success: result.success,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza una joya existente.
 * Soporta actualización parcial (PATCH) y total (PUT).
 */
export const putProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const productData = req.body;
    const files = req.files as Express.Multer.File[] | undefined;

    const result = await productFacade.updateProduct(id, productData, files);

    res.status(result.status).json({
      success: result.success,
      data: result.data,
      message: result.message,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    next(error);
  }
};
