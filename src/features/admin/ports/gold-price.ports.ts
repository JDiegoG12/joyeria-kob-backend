import { FacadeResult } from '../../../shared/types/facade';
import {
  GoldPriceResponseDTO,
  UpdateGoldPriceDTO,
} from '../dtos/gold-price.dto';

export interface IGoldPriceFacade {
  getCurrentGoldPrice(): Promise<FacadeResult<GoldPriceResponseDTO>>;
  updateGoldPrice(
    data: UpdateGoldPriceDTO,
  ): Promise<FacadeResult<GoldPriceResponseDTO>>;
}
