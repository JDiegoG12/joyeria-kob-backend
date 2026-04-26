import { FacadeResult } from '../../../shared/types/facade';
import {
  GoldPriceResponseDTO,
  UpdateGoldPriceDTO,
  GoldPriceHistoryResponseDTO,
} from '../dtos/gold-price.dto';

export interface IGoldPriceFacade {
  updateGoldPrice(
    data: UpdateGoldPriceDTO,
  ): Promise<FacadeResult<GoldPriceResponseDTO>>;
  getGoldPriceHistory(): Promise<FacadeResult<GoldPriceHistoryResponseDTO[]>>;
}
