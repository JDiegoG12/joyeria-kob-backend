import { Request, Response } from 'express';
import { socialContentFacade } from '../facade/social-content.facade';
import { matchedData } from 'express-validator';
import {
  ICreateSocialContentDTO,
  IUpdateSocialContentDTO,
} from '../dtos/social-content.dto';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

/**
 * GET /api/social-contents — Lista todos los contenidos sociales.
 */
export const getAllSocialContentsController = async (
  req: Request,
  res: Response,
) => {
  const result = await socialContentFacade.getAll();
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(200).json(result);
};

/**
 * GET /api/social-contents/:id — Obtiene un contenido social por su ID.
 */
export const getSocialContentByIdController = async (
  req: Request,
  res: Response,
) => {
  const { id } = matchedData(req);
  const result = await socialContentFacade.getById(id);
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(200).json(result);
};

/**
 * POST /api/social-contents — Crea un contenido social. Requiere imagen.
 */
export const createSocialContentController = async (
  req: Request,
  res: Response,
) => {
  const cleanData = matchedData(req);
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      error: ERROR_CODES.MISSING_FIELDS,
      message: 'La imagen es requerida.',
    });
  }

  const result = await socialContentFacade.create(
    cleanData as Omit<ICreateSocialContentDTO, 'imageUrl'>,
    file,
  );
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(201).json(result);
};

/**
 * PUT /api/social-contents/:id — Actualiza un contenido social. Imagen opcional.
 */
export const updateSocialContentController = async (
  req: Request,
  res: Response,
) => {
  const { id, ...updateData } = matchedData(req);
  const file = req.file;

  const result = await socialContentFacade.update(
    id,
    updateData as IUpdateSocialContentDTO,
    file,
  );
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(200).json(result);
};

/**
 * DELETE /api/social-contents/:id — Elimina un contenido social.
 */
export const deleteSocialContentController = async (
  req: Request,
  res: Response,
) => {
  const { id } = matchedData(req);
  const result = await socialContentFacade.delete(id);
  if (!result.success) {
    return res.status(result.statusCode!).json(result);
  }
  res.status(200).json(result);
};
