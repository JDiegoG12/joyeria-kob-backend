import { UserRole, ProductStatus } from '@prisma/client';
import { TokenPayload } from '../../../api/middlewares/auth.middleware';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { FacadeResult } from '../../../shared/types/facade';
import {
  StatsQueryDTO,
  StatsResponseDTO,
  CategoryStatsResponseDTO,
  TopFavoriteProductDTO,
} from '../dtos/product-stats.dto';
import { IProductStatsFacade } from '../ports/product-stats.ports';
import { GroupedResult } from '../services/product-stats.service';
import * as statsService from '../services/product-stats.service';

/**
 * Fachada de estadísticas de productos: aplica las reglas de visibilidad según
 * el rol del usuario, delega las agregaciones en el servicio de estadísticas y
 * da forma a la respuesta (totales, agrupaciones por categoría o estado).
 */
export class ProductStatsFacade implements IProductStatsFacade {
  /**
   * Obtiene estadísticas de productos.
   *
   * Los clientes (o usuarios anónimos) solo ven productos `AVAILABLE` y no pueden
   * agrupar ni filtrar por estado; los administradores pueden filtrar por estado.
   * Si se indica `categoryId`, devuelve un conteo simple incluyendo subcategorías;
   * de lo contrario, devuelve el total y, opcionalmente, las agrupaciones.
   *
   * @param user - Usuario autenticado (o `undefined` para anónimo).
   * @param query - Filtros y criterio de agrupación.
   * @returns Resultado con las estadísticas o un error de permisos/validación.
   */
  async getStats(
    user: TokenPayload | undefined,
    query: StatsQueryDTO,
  ): Promise<FacadeResult<StatsResponseDTO | CategoryStatsResponseDTO>> {
    const { agrupar, estado, categoryId } = query;
    let statusFilter: ProductStatus[];
    let serviceGroupBy: 'categoryId' | 'status' | undefined;

    // Mapear los términos del DTO a los nombres de campo de Prisma
    if (agrupar === 'categoria') {
      serviceGroupBy = 'categoryId';
    } else if (agrupar === 'estado') {
      serviceGroupBy = 'status';
    }

    // 1. Determinar filtros según el rol del usuario
    if (!user || user.role === UserRole.CLIENT) {
      // Clientes y usuarios no autenticados solo ven productos DISPONIBLES.
      statusFilter = [ProductStatus.AVAILABLE];
      // Y no pueden agrupar por estado ni filtrar por estado.
      if (agrupar === 'estado' || estado) {
        return {
          success: false,
          error: ERROR_CODES.FORBIDDEN,
          message: 'No tienes permiso para agrupar o filtrar por estado.',
          statusCode: 403,
        };
      }
    } else if (user.role === UserRole.ADMIN) {
      // Admins pueden filtrar por un estado específico o ver todos
      statusFilter = estado
        ? [estado]
        : [
            ProductStatus.AVAILABLE,
            ProductStatus.OUT_OF_STOCK,
            ProductStatus.HIDDEN,
          ];
    } else {
      // Salvaguarda para roles no reconocidos
      return {
        success: false,
        error: ERROR_CODES.FORBIDDEN,
        message: 'Rol de usuario no reconocido.',
        statusCode: 403,
      };
    }

    // Si se proporciona categoryId, ignorar 'agrupar' y devolver un conteo simple.
    if (categoryId) {
      // Validar que la categoría exista en la base de datos
      const categoryExists = await statsService.findCategoryById(categoryId);
      if (!categoryExists) {
        return {
          success: false,
          error: ERROR_CODES.CATEGORY_NOT_FOUND,
          message: `La categoría con ID ${categoryId} no fue encontrada.`,
          statusCode: 404,
        };
      }

      // Obtener todos los IDs de categorías descendientes (incluyendo la propia)
      const allCategoryIds =
        await statsService.getDescendantCategoryIds(categoryId);

      const { total } = await statsService.fetchProductStats({
        statusFilter,
        categoryIds: allCategoryIds, // Pasar el array de IDs
      });
      return {
        success: true,
        data: { categoryId: categoryId, cantidad: total },
        message: `Cantidad de productos para la categoría ${categoryId} (incluyendo subcategorías) obtenida correctamente.`,
      };
    }

    // 2. Obtener datos crudos del servicio
    try {
      const { total, grouped } = await statsService.fetchProductStats({
        statusFilter,
        groupBy: serviceGroupBy,
        // categoryIds no se pasa aquí porque si categoryId estuviera presente, el bloque anterior ya habría retornado.
      });

      const response: StatsResponseDTO = {
        totalProductos: total,
      };

      // 3. Formatear los datos agrupados si existen
      if (agrupar && grouped) {
        if (agrupar === 'categoria') {
          const categoryMap = await statsService.getCategoryMap();
          response.porCategoria = (grouped as GroupedResult[]).reduce(
            (acc, item) => {
              // Asegurarse de que categoryId no es null ni undefined
              if (item.categoryId != null) {
                const categoryName =
                  categoryMap.get(item.categoryId) ||
                  `Categoría Desconocida (${item.categoryId})`;
                acc[categoryName] = item._count._all;
              }
              return acc;
            },
            {} as Record<string, number>,
          );
        } else if (agrupar === 'estado') {
          response.porEstado = (grouped as GroupedResult[]).reduce(
            (acc, item) => {
              if (item.status) {
                acc[item.status] = item._count._all;
              }
              return acc;
            },
            {} as Record<string, number>,
          );
        }
      }

      return {
        success: true,
        data: response,
        message: 'Estadísticas obtenidas correctamente.',
      };
    } catch (error) {
      console.error('Error in ProductStatsFacade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Ocurrió un error al procesar las estadísticas.',
        statusCode: 500,
      };
    }
  }

  /**
   * Obtiene el top de productos más marcados como favoritos. Operación exclusiva
   * de administradores.
   *
   * @param user - Usuario autenticado; debe tener rol ADMIN.
   * @param limit - Número máximo de productos a devolver.
   * @returns Resultado con el top de favoritos o un error 403 si no es ADMIN.
   */
  async getTopFavoriteProducts(
    user: TokenPayload | undefined,
    limit: number,
  ): Promise<FacadeResult<TopFavoriteProductDTO[]>> {
    if (!user || user.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: ERROR_CODES.FORBIDDEN,
        message: 'No tienes permiso para consultar esta metrica.',
        statusCode: 403,
      };
    }

    try {
      const topFavorites = await statsService.getTopFavoriteProducts(limit);
      return {
        success: true,
        data: topFavorites,
        message: 'Top de favoritos obtenido correctamente.',
      };
    } catch (error) {
      console.error(
        'Error in ProductStatsFacade.getTopFavoriteProducts:',
        error,
      );
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Ocurrio un error al obtener el top de favoritos.',
        statusCode: 500,
      };
    }
  }
}
