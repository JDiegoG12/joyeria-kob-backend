import { FacadeResult } from '../../../shared/types/facade';
import { UserRole } from '@prisma/client';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { FavoriteWithProduct } from '../../favorites/ports/favorite.ports';
import { CustomersListResult } from '../ports/customer.ports';
import { CustomerListItemDTO } from '../dtos/customer.dto';
import { findUserById } from '../services/user.service';
import {
  countClients,
  findClientFavorites,
  findClientsPaginated,
} from '../services/customer.service';

/** Página por defecto cuando no se especifica. */
const DEFAULT_PAGE = 1;
/** Cantidad de clientes por página por defecto. */
const DEFAULT_LIMIT = 10;
/** Tope máximo de registros por página para proteger la base de datos. */
const MAX_LIMIT = 50;

/**
 * Fachada del módulo de Clientes (panel administrativo).
 * Contiene la lógica de negocio: validación/normalización de parámetros,
 * armado de la paginación y manejo de errores. Nunca lanza: siempre devuelve un
 * `FacadeResult`.
 */
export class CustomerFacade {
  /**
   * Lista clientes (rol `CLIENT`) de forma paginada y con búsqueda opcional.
   *
   * @param page - Página solicitada (se normaliza a >= 1).
   * @param limit - Registros por página (se acota a [1, 50]).
   * @param search - Término de búsqueda por nombre, apellido, correo o teléfono.
   */
  async getCustomers(
    page?: number,
    limit?: number,
    search?: string,
  ): Promise<FacadeResult<CustomersListResult>> {
    // Normaliza y acota los parámetros de paginación.
    const safePage = page && page > 0 ? Math.trunc(page) : DEFAULT_PAGE;
    const safeLimit =
      limit && limit > 0 ? Math.min(Math.trunc(limit), MAX_LIMIT) : DEFAULT_LIMIT;

    try {
      // Consulta la página y el total en paralelo para reducir latencia.
      const [clients, total] = await Promise.all([
        findClientsPaginated({ page: safePage, limit: safeLimit, search }),
        countClients(search),
      ]);

      const customers = clients.map((client) => new CustomerListItemDTO(client));
      const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

      return {
        success: true,
        data: {
          customers,
          pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages,
            hasNextPage: totalPages > 0 && safePage < totalPages,
            hasPrevPage: totalPages > 0 && safePage > 1,
          },
        },
        message: 'Listado de clientes obtenido correctamente.',
      };
    } catch {
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener el listado de clientes.',
        statusCode: 500,
      };
    }
  }

  /**
   * Obtiene los favoritos de un cliente específico.
   *
   * Valida que el usuario exista y que sea un cliente (no se permite consultar
   * favoritos de cuentas administrador desde este módulo).
   *
   * @param id - ID del cliente.
   */
  async getCustomerFavorites(
    id: string,
  ): Promise<FacadeResult<FavoriteWithProduct[]>> {
    if (!id) {
      return {
        success: false,
        error: ERROR_CODES.INVALID_ID,
        message: 'El ID suministrado no es válido.',
        statusCode: 400,
      };
    }

    try {
      const user = await findUserById(id);

      if (!user || user.role !== UserRole.CLIENT) {
        return {
          success: false,
          error: ERROR_CODES.USER_NOT_FOUND,
          message: 'El cliente solicitado no existe.',
          statusCode: 404,
        };
      }

      const favorites = await findClientFavorites(id);

      return {
        success: true,
        data: favorites,
        message: 'Favoritos del cliente obtenidos correctamente.',
      };
    } catch {
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener los favoritos del cliente.',
        statusCode: 500,
      };
    }
  }
}
