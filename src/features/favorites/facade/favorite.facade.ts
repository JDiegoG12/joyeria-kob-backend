import { Favorite } from '@prisma/client';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import {
  FacadeResult,
  FavoriteWithProduct,
  IFavoriteFacade,
} from '../ports/favorite.ports';
import {
  addFavoriteService,
  getUserFavoritesService,
  removeFavoriteService,
} from '../services/favorite.service';

/** Forma mínima de un error originado en la capa de servicio. */
type ServiceError = { code?: string; status?: number; message?: string };

/**
 * Convierte un error arbitrario de la capa de servicio en un `FacadeResult`
 * de fallo, aplicando valores por defecto cuando faltan código o estado.
 *
 * @param error - Error capturado en la fachada.
 * @param fallbackMessage - Mensaje a usar si el error no aporta uno propio.
 * @returns Un resultado de fachada fallido normalizado.
 */
const normalizeServiceError = <T>(
  error: unknown,
  fallbackMessage: string,
): FacadeResult<T> => {
  const err = error as ServiceError;
  return {
    success: false,
    error: err.code ?? ERROR_CODES.INTERNAL_ERROR,
    message: err.message ?? fallbackMessage,
    status: err.status ?? 500,
  };
};

/**
 * Fachada de favoritos: orquesta los servicios de favoritos y unifica las
 * respuestas en el formato `FacadeResult`, normalizando los errores.
 */
class FavoriteFacade implements IFavoriteFacade {
  /**
   * Obtiene los favoritos del usuario con el producto y su precio calculado.
   *
   * @param userId - ID del usuario autenticado.
   * @returns Resultado con la lista de favoritos o un error normalizado.
   */
  async getUserFavorites(
    userId: string,
  ): Promise<FacadeResult<FavoriteWithProduct[]>> {
    try {
      const favorites = await getUserFavoritesService(userId);
      return {
        success: true,
        data: favorites,
        message: 'Favoritos obtenidos correctamente.',
        status: 200,
      };
    } catch (error) {
      console.error('[FavoriteFacade] getUserFavorites error:', error);
      return normalizeServiceError(error, 'Error al obtener favoritos.');
    }
  }

  /**
   * Agrega un producto a los favoritos del usuario.
   *
   * @param userId - ID del usuario autenticado.
   * @param productId - ID del producto a marcar como favorito.
   * @returns Resultado con el favorito creado o un error normalizado.
   */
  async addFavorite(
    userId: string,
    productId: string,
  ): Promise<FacadeResult<Favorite>> {
    try {
      const favorite = await addFavoriteService(userId, productId);
      return {
        success: true,
        data: favorite,
        message: 'Producto agregado a favoritos.',
        status: 201,
      };
    } catch (error) {
      console.error('[FavoriteFacade] addFavorite error:', error);
      return normalizeServiceError(error, 'Error al agregar a favoritos.');
    }
  }

  /**
   * Elimina un producto de los favoritos del usuario.
   *
   * @param userId - ID del usuario autenticado.
   * @param productId - ID del producto a quitar de favoritos.
   * @returns Resultado exitoso (`true`) o un error normalizado.
   */
  async removeFavorite(
    userId: string,
    productId: string,
  ): Promise<FacadeResult<boolean>> {
    try {
      await removeFavoriteService(userId, productId);
      return {
        success: true,
        data: true,
        message: 'Producto eliminado de favoritos.',
        status: 200,
      };
    } catch (error) {
      console.error('[FavoriteFacade] removeFavorite error:', error);
      return normalizeServiceError(error, 'Error al eliminar favoritos.');
    }
  }
}

export const favoriteFacade = new FavoriteFacade();
