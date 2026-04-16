import { SystemSetting } from '../models/gold-price.model';

/**
 * DTO para la respuesta al obtener el precio del oro.
 */
export class GoldPriceResponseDTO {
  goldPricePerGram: number;
  lastUpdate: Date;

  constructor(settings: SystemSetting) {
    this.goldPricePerGram = settings.goldPricePerGram.toNumber();
    this.lastUpdate = settings.lastUpdate;
  }
}

export interface UpdateGoldPriceDTO {
  goldPricePerGram: number;
}
