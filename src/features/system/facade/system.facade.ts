import { GoldPriceResponseDTO } from '../../../shared/dtos/gold-price.dto';
import { FacadeResult } from '../../../shared/types/facade';
import * as systemService from '../services/system.service';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { ISystemFacade } from '../ports/system.ports';

export class SystemFacade implements ISystemFacade {
  async getCurrentGoldPrice(): Promise<FacadeResult<GoldPriceResponseDTO>> {
    try {
      const settings = await systemService.getGoldPriceSetting();

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
}
