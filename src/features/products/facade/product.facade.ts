import { IProductFacade, FacadeResult } from '../ports/product.ports';
import {
  getAllProductsService,
  getProductByIdService,
  createProductService,
  deleteProductService,
  updateProductService,
} from '../services/product-service';
import { IProductCreateRaw, IProductUpdateRaw } from '../models/product-types';
import { ERROR_CODES } from '../../../shared/constants/error-codes';

class ProductFacade implements IProductFacade {
  async getProducts(isAdmin: boolean): Promise<FacadeResult<any>> {
    try {
      const products = await getAllProductsService(isAdmin);
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

  async getProduct(id: string): Promise<FacadeResult<any>> {
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

  async createProduct(
    data: IProductCreateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<any>> {
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
    } catch (error: any) {
      console.error('[ProductFacade] createProduct error:', error);
      const isSettingsError = error.code === 'SETTINGS_NOT_FOUND';
      return {
        success: false,
        error: isSettingsError
          ? ERROR_CODES.SETTINGS_NOT_FOUND
          : ERROR_CODES.INTERNAL_ERROR,
        message: isSettingsError
          ? 'No se encontró la configuración base del precio de oro.'
          : 'Error al crear la joya.',
        status: error.status || 500,
      };
    }
  }

  async deleteProduct(id: string): Promise<FacadeResult<boolean>> {
    try {
      await deleteProductService(id);
      return {
        success: true,
        message: 'Producto eliminado correctamente.',
        status: 200,
      };
    } catch (error: any) {
      console.error('[ProductFacade] deleteProduct error:', error);

      const notFound =
        error.code === 'PRODUCT_NOT_FOUND' || error.code === 'P2025';
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

  async updateProduct(
    id: string,
    data: IProductUpdateRaw,
    files: Express.Multer.File[] | undefined,
  ): Promise<FacadeResult<any>> {
    try {
      const updatedProduct = await updateProductService(id, data, files);
      return {
        success: true,
        data: updatedProduct,
        message: 'Joya actualizada y precio recalculado correctamente.',
        status: 200,
      };
    } catch (error: any) {
      console.error('[ProductFacade] updateProduct error:', error);

      if (error.code === 'PRODUCT_NOT_FOUND') {
        return {
          success: false,
          error: ERROR_CODES.PRODUCT_NOT_FOUND,
          message:
            'La joya o variación solicitada no fue hallada en el sistema.',
          status: 404,
        };
      }

      if (error.code === 'BUSINESS_CONSTRAINT_FAILED') {
        return {
          success: false,
          error: ERROR_CODES.BUSINESS_CONSTRAINT_FAILED,
          message: error.message,
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
