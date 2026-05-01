import { Request, Response } from 'express';
import { bannerFacade } from '../facade/banner.facade';
import { UpdateBannerRequestDto } from '../dtos/update-banner.dto';

export const getBannerController = async (_req: Request, res: Response) => {
  const result = await bannerFacade.getBanner();
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  }
  return res.status(200).json(result); // Si es success, siempre hay data
};

export const updateBannerController = async (req: Request, res: Response) => {
  const bannerData: UpdateBannerRequestDto = req.body;
  const result = await bannerFacade.updateBanner(
    bannerData,
    req.file as Express.Multer.File | undefined,
  );
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  }
  // Para DELETE, un 204 No Content es una buena práctica si no se devuelve contenido.
  // Sin embargo, el contrato actual de FacadeResult<null> implica un cuerpo JSON con success:true, data:null.
  // Mantendremos 200 OK con el cuerpo para consistencia con el formato de respuesta unificado.
  return res.status(200).json(result);
};

export const deleteBannerController = async (_req: Request, res: Response) => {
  const result = await bannerFacade.deleteBanner();
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  }
  return res.status(200).json(result);
};
