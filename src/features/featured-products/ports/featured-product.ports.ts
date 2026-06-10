import { FeaturedProduct } from '@prisma/client';
import { ProductoWithPrice } from '../../products/ports/product.ports';
import { ReorderFeaturedProductsDto } from '../dtos/featured-product.dto';

/** Producto destacado junto con su producto y los precios calculados. */
export type FeaturedProductWithPrice = FeaturedProduct & {
  product: ProductoWithPrice;
};

/** Resultado uniforme devuelto por la fachada de productos destacados. */
export type FacadeResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

/** Contrato de la fachada de productos destacados. */
export interface IFeaturedProductFacade {
  /** Lista los productos destacados ordenados por posición. */
  getFeaturedProducts(): Promise<FacadeResult<FeaturedProductWithPrice[]>>;
  /** Agrega un producto a los destacados. */
  addFeaturedProduct(
    productId: string,
  ): Promise<FacadeResult<FeaturedProductWithPrice>>;
  /** Quita un producto de los destacados. */
  removeFeaturedProduct(productId: string): Promise<FacadeResult<null>>;
  /** Reordena por completo la lista de destacados. */
  reorderFeaturedProducts(
    items: ReorderFeaturedProductsDto,
  ): Promise<FacadeResult<FeaturedProductWithPrice[]>>;
}
