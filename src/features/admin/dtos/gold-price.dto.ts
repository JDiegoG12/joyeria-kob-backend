import { SystemSetting, GoldPriceHistory } from '@prisma/client';

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
 * DTO de entrada para actualizar el precio del oro por gramo.
 */
export interface UpdateGoldPriceDTO {
  goldPricePerGram: number;
}

/**
 * DTO de respuesta para un registro del historial de precios del oro.
 * Expone `goldPricePerGram` como número y la fecha del registro en `date`.
 */
export class GoldPriceHistoryResponseDTO {
  id: number;
  goldPricePerGram: number;
  date: Date;

  constructor(historyRecord: GoldPriceHistory) {
    this.id = historyRecord.id;
    this.goldPricePerGram = historyRecord.goldPricePerGram.toNumber();
    this.date = historyRecord.createdAt;
  }
}
