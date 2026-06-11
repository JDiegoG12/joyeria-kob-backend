import { updateProductService } from '../services/product-service';
import { prisma } from '../../../config/prisma';
import { removeFeaturedProductIfPresent } from '../../featured-products/services/featured-product.service';

// Mockea Prisma para aislar la lógica del servicio de la base de datos real.
jest.mock('../../../config/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    systemSetting: {
      findUnique: jest.fn(),
    },
  },
}));

// Evita cargar `sharp` (módulo nativo) durante los tests.
jest.mock('../../../shared/utils/image.processor', () => ({
  processAndSaveImage: jest.fn(),
}));

// Aísla la limpieza de destacados: solo nos interesa verificar que se dispara.
jest.mock('../../featured-products/services/featured-product.service', () => ({
  removeFeaturedProductIfPresent: jest.fn(),
}));

const mockedProduct = prisma.product as unknown as {
  findUnique: jest.Mock;
  update: jest.Mock;
};
const mockedSetting = prisma.systemSetting as unknown as {
  findUnique: jest.Mock;
};
const mockedRemoveFeatured = removeFeaturedProductIfPresent as jest.Mock;

/** Crea un objeto tipo Prisma.Decimal con `toNumber()`. */
const dec = (n: number) => ({ toNumber: () => n });

const baseProduct = {
  id: 'prod-uuid',
  baseWeight: dec(1),
  additionalValue: dec(0),
  discountValue: dec(0),
  stock: 5,
  status: 'AVAILABLE',
  images: [],
};

describe('updateProductService — limpieza de destacados al ocultar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSetting.findUnique.mockResolvedValue({
      goldPricePerGram: dec(350000),
    });
  });

  it('quita el producto de destacados cuando queda en HIDDEN', async () => {
    mockedProduct.findUnique.mockResolvedValue(baseProduct);
    mockedProduct.update.mockResolvedValue({
      ...baseProduct,
      status: 'HIDDEN',
    });

    await updateProductService('prod-uuid', { status: 'HIDDEN' });

    expect(mockedRemoveFeatured).toHaveBeenCalledTimes(1);
    expect(mockedRemoveFeatured).toHaveBeenCalledWith('prod-uuid');
  });

  it('NO toca destacados cuando el producto sigue disponible', async () => {
    mockedProduct.findUnique.mockResolvedValue(baseProduct);
    mockedProduct.update.mockResolvedValue(baseProduct);

    await updateProductService('prod-uuid', { status: 'AVAILABLE' });

    expect(mockedRemoveFeatured).not.toHaveBeenCalled();
  });
});
