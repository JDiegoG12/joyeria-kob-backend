import { Request, Response } from 'express';
import { matchedData } from 'express-validator';
import { promoBannerFacade } from '../facade/promo-banner.facade';
import {
  IPromoBannerCreateRaw,
  IPromoBannerUpdateRaw,
  IReorderPromoBannerItem,
} from '../dtos/promo-banner.dto';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

/**
 * GET /api/promo-banners — Lista todos los banners de promoción.
 */
export const getAllPromoBannersController = async (
  req: Request,
  res: Response,
) => {
  const result = await promoBannerFacade.getAll();
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(200).json(result);
};

/**
 * GET /api/promo-banners/:id — Obtiene un banner de promoción por su ID.
 */
export const getPromoBannerByIdController = async (
  req: Request,
  res: Response,
) => {
  const { id } = matchedData(req);
  const result = await promoBannerFacade.getById(id);
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(200).json(result);
};

/**
 * POST /api/promo-banners — Crea un banner de promoción. Requiere imagen.
 */
export const createPromoBannerController = async (
  req: Request,
  res: Response,
) => {
  const cleanData = matchedData(req);
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      error: ERROR_CODES.MISSING_FIELDS,
      message: 'La imagen del banner es requerida.',
    });
  }

  const result = await promoBannerFacade.create(
    cleanData as IPromoBannerCreateRaw,
    file,
  );
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(201).json(result);
};

/**
 * PUT /api/promo-banners/:id — Actualiza un banner de promoción. Imagen opcional.
 */
export const updatePromoBannerController = async (
  req: Request,
  res: Response,
) => {
  const { id, ...updateData } = matchedData(req);
  const file = req.file;

  const result = await promoBannerFacade.update(
    id,
    updateData as IPromoBannerUpdateRaw,
    file,
  );
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(200).json(result);
};

/**
 * DELETE /api/promo-banners/:id — Elimina un banner de promoción.
 */
export const deletePromoBannerController = async (
  req: Request,
  res: Response,
) => {
  const { id } = matchedData(req);
  const result = await promoBannerFacade.delete(id);
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(200).json(result);
};

/**
 * PUT /api/promo-banners/reorder — Reordena los banners. Recibe `items` con el
 * id y la nueva posición de cada banner, normalizando los valores numéricos.
 */
export const reorderPromoBannersController = async (
  req: Request,
  res: Response,
) => {
  const items = req.body?.items as IReorderPromoBannerItem[] | undefined;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Debe enviar un arreglo "items" con id y position de cada banner.',
    });
  }

  // Normaliza a números por si llegan como strings desde el cliente.
  const normalized: IReorderPromoBannerItem[] = items.map((item) => ({
    id: Number(item.id),
    position: Number(item.position),
  }));

  if (normalized.some((i) => !Number.isInteger(i.id) || !Number.isInteger(i.position))) {
    return res.status(400).json({
      success: false,
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Cada item debe tener un id y una position enteros.',
    });
  }

  const result = await promoBannerFacade.reorder(normalized);
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(200).json(result);
};
