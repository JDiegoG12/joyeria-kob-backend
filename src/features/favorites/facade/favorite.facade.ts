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

type ServiceError = { code?: string; status?: number; message?: string };

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

class FavoriteFacade implements IFavoriteFacade {
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
