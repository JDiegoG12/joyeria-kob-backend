import { Product, Category } from '@prisma/client';
import { IProductCreateRaw, IProductUpdateRaw } from '../models/product-types';

/** Producto con su precio calculado, descuento y precio final aplicados. */
export type ProductoWithPrice = Omit<
  Product,
  'calculatedPrice' | 'discountValue'
> & {
  calculatedPrice: number;
  /** Descuento fijo en COP (0 = sin descuento). */
  discountValue: number;
  /** Precio con el descuento aplicado, nunca menor a 0. */
  finalPrice: number;
};
/** Producto con precios calculados y su categoría incluida. */
export type ProductWithCategoryAndPrice = ProductoWithPrice & {
  category: Category;
};

/** Metadatos de paginación del catálogo. */
export type CatalogPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/** Rango de precios (mínimo y máximo) presente en el catálogo. */
export type PriceRange = {
  min: number;
  max: number;
};

/** Respuesta del catálogo: productos, paginación y rango de precios. */
export type ProductCatalogResponse = {
  products: ProductWithCategoryAndPrice[];
  pagination: CatalogPagination;
  priceRange: PriceRange;
};

/** Resultado uniforme devuelto por la fachada de productos. */
export type FacadeResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
};

/** Contrato de la fachada de productos. */
export interface IProductFacade {
  /** Lista los productos (la vista admin incluye ocultos/inactivos). */
  getProducts(
    isAdmin: boolean,
    categoryId?: number,
  ): Promise<FacadeResult<ProductWithCategoryAndPrice[]>>;
  /** Consulta el catálogo público con filtros, búsqueda y paginación. */
  getCatalogProducts(
    categoryId: number | undefined,
    minPrice: number | undefined,
    maxPrice: number | undefined,
    search: string | undefined,
    page: number | undefined,
    limit: number | undefined,
  ): Promise<FacadeResult<ProductCatalogResponse>>;
  /** Obtiene un producto por su ID. */
  getProduct(id: string): Promise<FacadeResult<ProductWithCategoryAndPrice>>;
  /** Crea un producto con sus imágenes y calcula su precio. */
  createProduct(
    data: IProductCreateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<ProductoWithPrice>>;
  /** Elimina un producto por su ID. */
  deleteProduct(id: string): Promise<FacadeResult<boolean>>;
  /** Actualiza un producto y recalcula su precio. */
  updateProduct(
    id: string,
    data: IProductUpdateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<ProductoWithPrice>>;
}
