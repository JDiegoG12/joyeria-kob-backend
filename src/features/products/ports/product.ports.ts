import { Product, Category } from '@prisma/client';
import { IProductCreateRaw, IProductUpdateRaw } from '../models/product-types';

export type ProductWithCategory = Product & { category: Category };

export type FacadeResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

export interface IProductFacade {
  getProducts(isAdmin: boolean): Promise<FacadeResult<ProductWithCategory[]>>;
  getProduct(id: string): Promise<FacadeResult<ProductWithCategory>>;
  createProduct(
    data: IProductCreateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<Product>>;
  deleteProduct(id: string): Promise<FacadeResult<boolean>>;
  updateProduct(
    id: string,
    data: IProductUpdateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<Product>>;
}
