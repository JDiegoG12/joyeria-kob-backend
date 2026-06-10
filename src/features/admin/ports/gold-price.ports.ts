import { FacadeResult } from '../../../shared/types/facade';
import {
  GoldPriceResponseDTO,
  UpdateGoldPriceDTO,
  GoldPriceHistoryResponseDTO,
} from '../dtos/gold-price.dto';

/** Contrato de la fachada de administración del precio del oro. */
export interface IGoldPriceFacade {
  /** Actualiza el precio del oro por gramo. */
  updateGoldPrice(
    data: UpdateGoldPriceDTO,
  ): Promise<FacadeResult<GoldPriceResponseDTO>>;
  /** Obtiene el historial de cambios del precio del oro. */
  getGoldPriceHistory(): Promise<FacadeResult<GoldPriceHistoryResponseDTO[]>>;
}
