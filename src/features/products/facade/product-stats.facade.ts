import { UserRole, ProductStatus } from '@prisma/client';
import { TokenPayload } from '../../../api/middlewares/auth.middleware';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { FacadeResult } from '../../../shared/types/facade';
import {
  StatsQueryDTO,
  StatsResponseDTO,
  CategoryStatsResponseDTO,
} from '../dtos/product-stats.dto';
import { IProductStatsFacade } from '../ports/product-stats.ports';
import { GroupedResult } from '../services/product-stats.service';
import * as statsService from '../services/product-stats.service';

export class ProductStatsFacade implements IProductStatsFacade {
  async getStats(
    user: TokenPayload,
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
    if (user.role === UserRole.CLIENT) {
      // Clientes solo ven productos DISPONIBLES y no pueden agrupar por estado
      statusFilter = [ProductStatus.AVAILABLE];
      if (agrupar === 'estado') {
        return {
          success: false,
          error: ERROR_CODES.FORBIDDEN,
          message: 'Los clientes no tienen permiso para agrupar por estado.',
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

      // Si la categoría existe, proceder con el conteo
      const { total } = await statsService.fetchProductStats({
        statusFilter,
        categoryId,
      });
      return {
        success: true,
        data: { categoryId: categoryId, cantidad: total },
        message: `Cantidad de productos para la categoría ${categoryId} obtenida correctamente.`, // statusCode no es parte de FacadeSuccess
      };
    }

    // 2. Obtener datos crudos del servicio
    try {
      const { total, grouped } = await statsService.fetchProductStats({
        statusFilter,
        groupBy: serviceGroupBy,
        categoryId,
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
        // statusCode no es parte de FacadeSuccess, el controlador lo manejará
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
}
