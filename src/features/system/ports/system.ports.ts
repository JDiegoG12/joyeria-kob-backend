import { FacadeResult } from '../../../shared/types/facade';
import { GoldPriceResponseDTO } from '../../../shared/dtos/gold-price.dto';

export interface ISystemFacade {
  getCurrentGoldPrice(): Promise<FacadeResult<GoldPriceResponseDTO>>;
}
