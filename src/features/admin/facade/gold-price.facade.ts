import { Prisma } from '@prisma/client';
import { IGoldPriceFacade } from '../ports/gold-price.ports';
import {
  GoldPriceResponseDTO,
  UpdateGoldPriceDTO,
} from '../../../shared/dtos/gold-price.dto';
import { FacadeResult } from '../../../shared/types/facade';
import * as systemService from '../../system/services/system.service';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

export class GoldPriceFacade implements IGoldPriceFacade {
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
}
