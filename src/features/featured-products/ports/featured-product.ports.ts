import { FeaturedProduct } from '@prisma/client';
import { ProductoWithPrice } from '../../products/ports/product.ports';
import { ReorderFeaturedProductsDto } from '../dtos/featured-product.dto';

export type FeaturedProductWithPrice = FeaturedProduct & {
  product: ProductoWithPrice;
};

export type FacadeResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

export interface IFeaturedProductFacade {
  getFeaturedProducts(): Promise<FacadeResult<FeaturedProductWithPrice[]>>;
  addFeaturedProduct(
    productId: string,
  ): Promise<FacadeResult<FeaturedProductWithPrice>>;
  removeFeaturedProduct(productId: string): Promise<FacadeResult<null>>;
  reorderFeaturedProducts(
    items: ReorderFeaturedProductsDto,
  ): Promise<FacadeResult<FeaturedProductWithPrice[]>>;
}
