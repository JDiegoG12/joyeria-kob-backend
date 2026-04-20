import { Product, Category } from '@prisma/client';
import { IProductCreateRaw, IProductUpdateRaw } from '../models/product-types';

export type ProductoWithPrice = Omit<Product, 'calculatedPrice'> & {
  calculatedPrice: number;
};
export type ProductWithCategoryAndPrice = ProductoWithPrice & {
  category: Category;
};

export type FacadeResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

export interface IProductFacade {
  getProducts(
    isAdmin: boolean,
    categoryId?: number,
  ): Promise<FacadeResult<ProductWithCategoryAndPrice[]>>;
  getProduct(id: string): Promise<FacadeResult<ProductWithCategoryAndPrice>>;
  createProduct(
    data: IProductCreateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<ProductoWithPrice>>;
  deleteProduct(id: string): Promise<FacadeResult<boolean>>;
  updateProduct(
    id: string,
    data: IProductUpdateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<ProductoWithPrice>>;
}
