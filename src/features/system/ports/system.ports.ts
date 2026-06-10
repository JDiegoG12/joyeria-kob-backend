import { FacadeResult } from '../../../shared/types/facade';
import { GoldPriceResponseDTO } from '../../../shared/dtos/gold-price.dto';

/** Contrato de la fachada del sistema. */
export interface ISystemFacade {
  /** Obtiene el precio actual del oro por gramo. */
  getCurrentGoldPrice(): Promise<FacadeResult<GoldPriceResponseDTO>>;
}
