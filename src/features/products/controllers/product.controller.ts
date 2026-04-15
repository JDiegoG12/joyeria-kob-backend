import { Request, Response, NextFunction } from 'express';
import {
  getAllProductsService,
  getProductByIdService,
  createProductService,
  deleteProductService,
  updateProductService,
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
    // Si la URL tiene un query ?admin=true, lo interpretamos como que el usuario es admin y le mostramos todo el catálogo, incluyendo los ocultos. Si no, solo mostramos los disponibles.
    const isAdmin = req.query.admin === 'true';
    const products = await getAllProductsService(isAdmin);
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
    // Capturamos los archivos de imagen inyectados por el middleware de Multer
    const files = req.files as Express.Multer.File[]; // Cast necesario para TypeScript

    //Validación de seguridad
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'MISSING_IMAGES',
        message: 'Se requieren imágenes para crear la joya.',
      });
      return;
    }

    const newProduct = await createProductService(productData, files);

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
    //req.files puede ser undifines si no se envian imagenes nuevas
    const files = req.files as Express.Multer.File[] | undefined;

    const updatedProduct = await updateProductService(id, productData, files);

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Joya actualizada y precio recalculado correctamente.',
    });
  } catch (error) {
    next(error);
  }
};
