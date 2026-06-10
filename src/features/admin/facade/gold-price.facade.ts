import { Prisma } from '@prisma/client';
import { IGoldPriceFacade } from '../ports/gold-price.ports';
import { GoldPriceHistoryResponseDTO } from '../dtos/gold-price.dto';
import {
  GoldPriceResponseDTO,
  UpdateGoldPriceDTO,
} from '../../../shared/dtos/gold-price.dto';
import { FacadeResult } from '../../../shared/types/facade';
import * as systemService from '../../system/services/system.service';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

/**
 * Fachada de administración del precio del oro: valida la entrada, delega en el
 * servicio del sistema y unifica las respuestas en el formato `FacadeResult`.
 */
export class GoldPriceFacade implements IGoldPriceFacade {
  /**
   * Actualiza el precio del oro por gramo.
   *
   * Valida que el valor sea un número positivo antes de persistirlo.
   *
   * @param data - Datos con el nuevo precio del oro.
   * @returns Resultado con el precio actualizado, o un error de validación (400)
   *   o interno (500).
   */
  async updateGoldPrice(
    data: UpdateGoldPriceDTO,
  ): Promise<FacadeResult<GoldPriceResponseDTO>> {
    const { goldPricePerGram } = data;

    if (
      goldPricePerGram === undefined ||
      typeof goldPricePerGram !== 'number' ||
      goldPricePerGram <= 0
    ) {
      return {
        success: false,
        error: ERROR_CODES.VALIDATION_ERROR,
        message: 'El precio del oro debe ser un número positivo.',
        statusCode: 400,
      };
    }

    try {
      const decimalPrice = new Prisma.Decimal(goldPricePerGram);
      const updatedSettings =
        await systemService.upsertGoldPriceSetting(decimalPrice);

      const responseDTO = new GoldPriceResponseDTO(updatedSettings);
      return {
        success: true,
        data: responseDTO,
        message: 'Precio del oro actualizado correctamente.',
      };
    } catch (error) {
      console.error('Error in updateGoldPrice facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Ocurrió un error al actualizar el precio del oro.',
        statusCode: 500,
      };
    }
  }
  /**
   * Obtiene el historial de cambios del precio del oro.
   *
   * @returns Resultado con el listado del historial, o un error interno (500).
   */
  async getGoldPriceHistory(): Promise<
    FacadeResult<GoldPriceHistoryResponseDTO[]>
  > {
    try {
      const historyRecords = await systemService.getGoldPriceHistoryService();

      const responseDTOs = historyRecords.map(
        (record) => new GoldPriceHistoryResponseDTO(record),
      );

      return {
        success: true,
        data: responseDTOs,
        message: 'Historial obtenido correctamente.',
      };
    } catch (error) {
      console.error('Error in getGoldPriceHistory facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Ocurrió un error al obtener el historial del precio del oro.',
        statusCode: 500,
      };
    }
  }
}
