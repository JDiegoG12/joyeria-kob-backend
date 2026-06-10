import {
  IProductFacade,
  FacadeResult,
  ProductWithCategoryAndPrice,
  ProductoWithPrice,
  ProductCatalogResponse,
} from '../ports/product.ports';
import {
  getAllProductsService,
  getCatalogProductsService,
  getProductByIdService,
  createProductService,
  deleteProductService,
  updateProductService,
} from '../services/product-service';
import { IProductCreateRaw, IProductUpdateRaw } from '../models/product-types';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

/** Forma mínima de un error originado en la capa de servicio. */
type ServiceError = { code?: string; status?: number; message?: string };

/**
 * Fachada de productos: orquesta los servicios del catálogo de joyas
 * (consulta, creación, actualización y eliminación) y unifica las respuestas en
 * el formato `FacadeResult`, mapeando los errores de negocio a códigos HTTP.
 */
class ProductFacade implements IProductFacade {
  /**
   * Obtiene el listado de productos. Según `isAdmin` se exponen o no los
   * productos ocultos/inactivos, con filtro opcional por categoría.
   */
  async getProducts(
    isAdmin: boolean,
    categoryId?: number,
  ): Promise<FacadeResult<ProductWithCategoryAndPrice[]>> {
    try {
      const products = await getAllProductsService(isAdmin, categoryId);
      return {
        success: true,
        data: products,
        message: 'Catálogo obtenido correctamente.',
        status: 200,
      };
    } catch (error) {
      console.error('[ProductFacade] getProducts error:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener el catálogo de productos.',
        status: 500,
      };
    }
  }

  /**
   * Orquesta la consulta del catálogo público con todos sus filtros opcionales.
   *
   * Delega en `getCatalogProductsService` pasando el parámetro `search` que
   * a su vez lo propaga a `getAllProductsService` para que el filtro de nombre
   * se resuelva directamente en la consulta SQL (Prisma `contains`), operando
   * sobre el catálogo completo y no solo sobre la página actual.
   *
   * @param categoryId - ID de categoría raíz o subcategoría. `undefined` = sin filtro.
   * @param minPrice   - Precio calculado mínimo en COP. `undefined` = sin límite inferior.
   * @param maxPrice   - Precio calculado máximo en COP. `undefined` = sin límite superior.
   * @param search     - Texto de búsqueda por nombre. `undefined` o `''` = sin filtro.
   * @param page       - Página a devolver (1-indexed). `undefined` → default 1.
   * @param limit      - Productos por página. `undefined` → default 12. Máximo 48.
   */
  async getCatalogProducts(
    categoryId: number | undefined,
    minPrice: number | undefined,
    maxPrice: number | undefined,
    search: string | undefined,
    page: number | undefined,
    limit: number | undefined,
  ): Promise<FacadeResult<ProductCatalogResponse>> {
    try {
      const result = await getCatalogProductsService({
        categoryId,
        minPrice,
        maxPrice,
        search,
        page,
        limit,
      });
      return {
        success: true,
        data: result,
        message: 'Catalogo obtenido correctamente.',
        status: 200,
      };
    } catch (error) {
      console.error('[ProductFacade] getCatalogProducts error:', error);
      const err = error as ServiceError;
      if (err.code === ERROR_CODES.VALIDATION_ERROR) {
        return {
          success: false,
          error: ERROR_CODES.VALIDATION_ERROR,
          message: err.message || 'Parámetros de precio inválidos.',
          status: err.status || 400,
        };
      }
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener el catálogo de productos.',
        status: 500,
      };
    }
  }

  /** Obtiene un producto por su ID, o un error 404 si no existe. */
  async getProduct(
    id: string,
  ): Promise<FacadeResult<ProductWithCategoryAndPrice>> {
    try {
      const product = await getProductByIdService(id);
      if (!product) {
        return {
          success: false,
          error: ERROR_CODES.PRODUCT_NOT_FOUND,
          message: 'La joya solicitada no existe en el catálogo.',
          status: 404,
        };
      }
      return {
        success: true,
        data: product,
        message: 'Producto obtenido correctamente.',
        status: 200,
      };
    } catch (error) {
      console.error('[ProductFacade] getProduct error:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener producto.',
        status: 500,
      };
    }
  }

  /**
   * Crea un producto a partir de los datos crudos del formulario y sus imágenes.
   * Exige al menos una imagen y mapea el error de configuración de precio del oro.
   */
  async createProduct(
    data: IProductCreateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<ProductoWithPrice>> {
    if (!files || files.length === 0) {
      return {
        success: false,
        error: ERROR_CODES.VALIDATION_ERROR,
        message: 'Se requieren imágenes para crear la joya.',
        status: 400,
      };
    }

    try {
      const newProduct = await createProductService(data, files);
      return {
        success: true,
        data: newProduct,
        message: 'Joya creada y precio calculado correctamente.',
        status: 201,
      };
    } catch (error: unknown) {
      console.error('[ProductFacade] createProduct error:', error);
      const err = error as ServiceError;
      const isSettingsError = err.code === 'SETTINGS_NOT_FOUND';
      return {
        success: false,
        error: isSettingsError
          ? ERROR_CODES.SETTINGS_NOT_FOUND
          : ERROR_CODES.INTERNAL_ERROR,
        message: isSettingsError
          ? 'No se encontró la configuración base del precio de oro.'
          : 'Error al crear la joya.',
        status: err.status || 500,
      };
    }
  }

  /** Elimina un producto por su ID, devolviendo 404 si no existe. */
  async deleteProduct(id: string): Promise<FacadeResult<boolean>> {
    try {
      await deleteProductService(id);
      return {
        success: true,
        message: 'Producto eliminado correctamente.',
        status: 200,
      };
    } catch (error: unknown) {
      console.error('[ProductFacade] deleteProduct error:', error);
      const err = error as ServiceError;

      const notFound = err.code === 'PRODUCT_NOT_FOUND' || err.code === 'P2025';
      if (notFound) {
        return {
          success: false,
          error: ERROR_CODES.PRODUCT_NOT_FOUND,
          message: 'El producto a eliminar no existe.',
          status: 404,
        };
      }

      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al eliminar el producto.',
        status: 500,
      };
    }
  }

  /**
   * Actualiza un producto y recalcula su precio. Mapea los errores de producto
   * no encontrado (404) y de restricción de negocio (400).
   */
  async updateProduct(
    id: string,
    data: IProductUpdateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<ProductoWithPrice>> {
    try {
      const updatedProduct = await updateProductService(id, data, files);
      return {
        success: true,
        data: updatedProduct,
        message: 'Joya actualizada y precio recalculado correctamente.',
        status: 200,
      };
    } catch (error: unknown) {
      console.error('[ProductFacade] updateProduct error:', error);
      const err = error as ServiceError;

      if (err.code === 'PRODUCT_NOT_FOUND') {
        return {
          success: false,
          error: ERROR_CODES.PRODUCT_NOT_FOUND,
          message:
            'La joya o variación solicitada no fue hallada en el sistema.',
          status: 404,
        };
      }

      if (err.code === 'BUSINESS_CONSTRAINT_FAILED') {
        return {
          success: false,
          error: ERROR_CODES.BUSINESS_CONSTRAINT_FAILED,
          message: err.message,
          status: 400,
        };
      }

      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al actualizar el producto.',
        status: 500,
      };
    }
  }
}

export const productFacade = new ProductFacade();
