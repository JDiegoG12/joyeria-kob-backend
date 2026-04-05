import { Request, Response } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  deleteProduct,
} from '../services/product.service';

/**
 * Retorna todas las joyas del catálogo.
 */
export const getProducts = (req: Request, res: Response): void => {
  const data = getAllProducts();
  res.json({ success: true, data });
};

/**
 * Retorna una joya específica por su ID.
 * Responde 404 si no existe siguiendo el formato unificado del manual JADI.
 */
export const getProduct = (req: Request, res: Response): void => {
  const id = String(req.params['id']);
  const product = getProductById(id);

  if (!product) {
    res.status(404).json({
      success: false,
      error: 'PRODUCT_NOT_FOUND',
      message: 'La joya solicitada no existe en el catálogo.',
    });
    return;
  }

  res.json({ success: true, data: product });
};

/**
 * Crea una nueva joya en el catálogo.
 * Responde 400 si faltan campos obligatorios.
 */
export const postProduct = (req: Request, res: Response): void => {
  const { name, description, priceCop, material, stock } = req.body as {
    name: string;
    description: string;
    priceCop: number;
    material: 'oro' | 'plata' | 'platino';
    stock: number;
  };

  if (!name || !description || !priceCop || !material || stock === undefined) {
    res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message:
        'Todos los campos son obligatorios: name, description, priceCop, material, stock.',
    });
    return;
  }

  const newProduct = createProduct({
    name,
    description,
    priceCop,
    material,
    stock,
  });
  res.status(201).json({ success: true, data: newProduct });
};

/**
 * Elimina una joya del catálogo por su ID.
 * Responde 404 si no existe.
 */
export const removeProduct = (req: Request, res: Response): void => {
  const id = String(req.params['id']);
  const deleted = deleteProduct(id);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'PRODUCT_NOT_FOUND',
      message: 'La joya solicitada no existe en el catálogo.',
    });
    return;
  }

  res.json({ success: true, message: 'Producto eliminado correctamente.' });
};
