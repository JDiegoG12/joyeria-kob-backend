import { IProductCreateRaw, IProductUpdateRaw } from '../models/product-types';

export type FacadeResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

export interface IProductFacade {
  getProducts(isAdmin: boolean): Promise<FacadeResult<any>>;
  getProduct(id: string): Promise<FacadeResult<any>>;
  createProduct(
    data: IProductCreateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<any>>;
  deleteProduct(id: string): Promise<FacadeResult<boolean>>;
  updateProduct(
    id: string,
    data: IProductUpdateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<any>>;
}
