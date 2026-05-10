import { ERROR_CODES } from '../../../shared/constants/error-codes';
import {
  IFeaturedProductFacade,
  FacadeResult,
  FeaturedProductWithPrice,
} from '../ports/featured-product.ports';
import {
  addFeaturedProductService,
  getFeaturedProductsService,
  removeFeaturedProductService,
  reorderFeaturedProductsService,
} from '../services/featured-product.service';
import { ReorderFeaturedProductsDto } from '../dtos/featured-product.dto';

type ServiceError = { code?: string; status?: number; message?: string };

const normalizeServiceError = <T>(
  error: unknown,
  fallbackMessage: string,
): FacadeResult<T> => {
  const err = error as ServiceError;
  return {
    success: false,
    error: err.code ?? ERROR_CODES.INTERNAL_ERROR,
    message: err.message ?? fallbackMessage,
    status: err.status ?? 500,
  };
};

class FeaturedProductFacade implements IFeaturedProductFacade {
  async getFeaturedProducts(): Promise<
    FacadeResult<FeaturedProductWithPrice[]>
  > {
    try {
      const featuredProducts = await getFeaturedProductsService();
      return {
        success: true,
        data: featuredProducts,
        message: 'Productos destacados obtenidos correctamente.',
        status: 200,
      };
    } catch (error) {
      console.error(
        '[FeaturedProductFacade] getFeaturedProducts error:',
        error,
      );
      return normalizeServiceError(
        error,
        'Error al obtener productos destacados.',
      );
    }
  }

  async addFeaturedProduct(
    productId: string,
  ): Promise<FacadeResult<FeaturedProductWithPrice>> {
    try {
      const featuredProduct = await addFeaturedProductService(productId);
      return {
        success: true,
        data: featuredProduct,
        message: 'Producto destacado agregado correctamente.',
        status: 201,
      };
    } catch (error) {
      console.error('[FeaturedProductFacade] addFeaturedProduct error:', error);
      return normalizeServiceError(
        error,
        'Error al agregar producto destacado.',
      );
    }
  }

  async removeFeaturedProduct(productId: string): Promise<FacadeResult<null>> {
    try {
      await removeFeaturedProductService(productId);
      return {
        success: true,
        data: null,
        message: 'Producto destacado eliminado correctamente.',
        status: 200,
      };
    } catch (error) {
      console.error(
        '[FeaturedProductFacade] removeFeaturedProduct error:',
        error,
      );
      return normalizeServiceError(
        error,
        'Error al eliminar producto destacado.',
      );
    }
  }

  async reorderFeaturedProducts(
    items: ReorderFeaturedProductsDto,
  ): Promise<FacadeResult<FeaturedProductWithPrice[]>> {
    try {
      const featuredProducts = await reorderFeaturedProductsService(items);
      return {
        success: true,
        data: featuredProducts,
        message: 'Productos destacados reordenados correctamente.',
        status: 200,
      };
    } catch (error) {
      console.error(
        '[FeaturedProductFacade] reorderFeaturedProducts error:',
        error,
      );
      return normalizeServiceError(
        error,
        'Error al reordenar productos destacados.',
      );
    }
  }
}

export const featuredProductFacade = new FeaturedProductFacade();
