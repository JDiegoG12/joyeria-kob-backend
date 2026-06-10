import { Favorite } from '@prisma/client';
import { ProductWithCategoryAndPrice } from '../../products/ports/product.ports';

/** Favorito junto con su producto, categoría y precios calculados. */
export type FavoriteWithProduct = Favorite & {
  product: ProductWithCategoryAndPrice;
};

/** Resultado uniforme devuelto por la fachada de favoritos. */
export type FacadeResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

/** Contrato de la fachada de favoritos. */
export interface IFavoriteFacade {
  /** Obtiene los favoritos del usuario (filtrando los HIDDEN u OUT_OF_STOCK). */
  getUserFavorites(
    userId: string,
  ): Promise<FacadeResult<FavoriteWithProduct[]>>;

  /** Agrega un producto a los favoritos del usuario. */
  addFavorite(
    userId: string,
    productId: string,
  ): Promise<FacadeResult<Favorite>>;

  /** Elimina un producto de los favoritos del usuario. */
  removeFavorite(
    userId: string,
    productId: string,
  ): Promise<FacadeResult<boolean>>;
}
