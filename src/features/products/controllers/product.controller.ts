import { Request, Response, NextFunction } from 'express';
import {
  getAllProductsService,
  getProductByIdService,
  createProductService,
  deleteProductService,
} from '../services/product-service';

/**
 * Obtiene todos los productos del catálogo.
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const products = await getAllProductsService();
    res.status(200).json({
      success: true,
      data: products,
      message: 'Catálogo obtenido correctamente.',
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
    const product = await getProductByIdService(id);

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'La joya solicitada no existe en el catálogo.',
      });
      return; // Early return vital
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Producto obtenido correctamente.',
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
    const newProduct = await createProductService(productData);

    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Joya creada y precio calculado correctamente.',
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
    await deleteProductService(id);

    res.status(200).json({
      success: true,
      message: 'Producto eliminado correctamente.',
    });
  } catch (error: unknown) {
    // Si Prisma falla porque el ID no existe
    if (error instanceof Error && error.message === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'La joya solicitada no existe.',
      });
      return;
    }
    next(error);
  }
};
