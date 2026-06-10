import { SystemSetting } from '../models/system.model';

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

/**
 * DTO para la actualización del precio del oro.
 */
export interface UpdateGoldPriceDTO {
  goldPricePerGram: number;
}
