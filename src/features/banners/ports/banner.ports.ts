import {
  BannerResponseDto,
  UpdateBannerRequestDto,
} from '../dtos/update-banner.dto';
import { FacadeResult } from '../../../shared/types/facade';

/** Contrato de la fachada del banner principal. */
export interface IBannerFacade {
  /** Obtiene el banner principal configurado. */
  getBanner(): Promise<FacadeResult<BannerResponseDto | null>>;
  /** Crea o actualiza el banner principal (imagen opcional). */
  updateBanner(
    data: UpdateBannerRequestDto,
    file?: Express.Multer.File,
  ): Promise<FacadeResult<BannerResponseDto>>;
  /** Elimina el banner principal y su imagen asociada. */
  deleteBanner(): Promise<FacadeResult<null>>;
}
