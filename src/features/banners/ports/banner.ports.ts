import {
  BannerResponseDto,
  UpdateBannerRequestDto,
} from '../dtos/update-banner.dto';
import { FacadeResult } from '../../../shared/types/facade';

export interface IBannerFacade {
  getBanner(): Promise<FacadeResult<BannerResponseDto | null>>;
  updateBanner(
    data: UpdateBannerRequestDto,
    file?: Express.Multer.File,
  ): Promise<FacadeResult<BannerResponseDto>>;
  deleteBanner(): Promise<FacadeResult<null>>;
}
