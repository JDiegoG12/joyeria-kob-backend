import { FacadeResult } from '../../../shared/types/facade';
import {
  GoldPriceResponseDTO,
  UpdateGoldPriceDTO,
} from '../../../shared/dtos/gold-price.dto';

export interface IGoldPriceFacade {
  updateGoldPrice(
    data: UpdateGoldPriceDTO,
  ): Promise<FacadeResult<GoldPriceResponseDTO>>;
}
