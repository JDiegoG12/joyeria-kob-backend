import { Favorite } from '@prisma/client';
import { ProductWithCategoryAndPrice } from '../../products/ports/product.ports';

export type FavoriteWithProduct = Favorite & {
  product: ProductWithCategoryAndPrice;
};

export type FacadeResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

export interface IFavoriteFacade {
  // Obtiene los favoritos del usuario (filtrando los que esten HIDDEN o OUT_OF_STOCK)
  getUserFavorites(
    userId: string,
  ): Promise<FacadeResult<FavoriteWithProduct[]>>;

  // Agrega a favoritos
  addFavorite(
    userId: string,
    productId: string,
  ): Promise<FacadeResult<Favorite>>;

  // Elimina de favoritos
  removeFavorite(
    userId: string,
    productId: string,
  ): Promise<FacadeResult<boolean>>;
}
