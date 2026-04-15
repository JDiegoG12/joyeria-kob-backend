import { Prisma } from '@prisma/client';
import { IGoldPriceFacade } from '../ports/gold-price.ports';
import {
  GoldPriceResponseDTO,
  UpdateGoldPriceDTO,
} from '../dtos/gold-price.dto';
import { FacadeResult } from '../../../shared/types/facade';
import * as goldPriceService from '../services/gold-price.service';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

export class GoldPriceFacade implements IGoldPriceFacade {
  async getCurrentGoldPrice(): Promise<FacadeResult<GoldPriceResponseDTO>> {
    try {
      const settings = await goldPriceService.getGoldPriceSetting();

      if (!settings) {
        return {
          success: false,
          error: ERROR_CODES.INTERNAL_ERROR,
          message:
            'La configuración del precio del oro no ha sido inicializada.',
          statusCode: 500,
        };
      }

      const responseDTO = new GoldPriceResponseDTO(settings);
      return {
        success: true,
        data: responseDTO,
        message: 'Precio del oro obtenido correctamente.',
      };
    } catch (error) {
      console.error('Error in getCurrentGoldPrice facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Ocurrió un error al obtener el precio del oro.',
        statusCode: 500,
      };
    }
  }

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
        await goldPriceService.upsertGoldPriceSetting(decimalPrice);

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
