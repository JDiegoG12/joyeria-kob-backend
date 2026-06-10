import { Request, Response } from 'express';
import { bannerFacade } from '../facade/banner.facade';
import { UpdateBannerRequestDto } from '../dtos/update-banner.dto';

/**
 * GET /api/banner — Devuelve el banner principal configurado.
 */
export const getBannerController = async (_req: Request, res: Response) => {
  const result = await bannerFacade.getBanner();
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  }
  return res.status(200).json(result);
};

/**
 * PUT /api/banner — Crea o actualiza el banner principal. La imagen es opcional.
 */
export const updateBannerController = async (req: Request, res: Response) => {
  const bannerData: UpdateBannerRequestDto = req.body;
  const result = await bannerFacade.updateBanner(
    bannerData,
    req.file as Express.Multer.File | undefined,
  );
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  }
  // Se mantiene 200 OK con cuerpo JSON para conservar el formato de respuesta unificado.
  return res.status(200).json(result);
};

/**
 * DELETE /api/banner — Elimina el banner principal y su imagen asociada.
 */
export const deleteBannerController = async (_req: Request, res: Response) => {
  const result = await bannerFacade.deleteBanner();
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  }
  return res.status(200).json(result);
};
