import { GoldPriceResponseDTO } from '../../../shared/dtos/gold-price.dto';
import { FacadeResult } from '../../../shared/types/facade';
import * as systemService from '../services/system.service';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { ISystemFacade } from '../ports/system.ports';

/**
 * Fachada del sistema: expone la información de configuración global (como el
 * precio del oro) en el formato unificado `FacadeResult`.
 */
export class SystemFacade implements ISystemFacade {
  /**
   * Obtiene el precio actual del oro a partir de la configuración del sistema.
   *
   * @returns Resultado con el DTO del precio del oro, o un error 500 si la
   *   configuración aún no ha sido inicializada.
   */
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
