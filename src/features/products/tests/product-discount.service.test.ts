import { updateProductService } from '../services/product-service';
import { prisma } from '../../../config/prisma';

// Mockea Prisma para aislar la lógica de descuento de la base de datos real.
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

const mockedProduct = prisma.product as unknown as {
  findUnique: jest.Mock;
  update: jest.Mock;
};
const mockedSetting = prisma.systemSetting as unknown as {
  findUnique: jest.Mock;
};

/** Crea un objeto tipo Prisma.Decimal con `toNumber()`. */
const dec = (n: number) => ({ toNumber: () => n });

/**
 * Producto base: peso 1g, sin valor adicional. Con oro a 350.000 COP/g,
 * el precio calculado resulta en 350.000 COP.
 */
const baseProduct = {
  id: 'prod-uuid',
  baseWeight: dec(1),
  additionalValue: dec(0),
  discountValue: dec(0),
  stock: 5,
  status: 'AVAILABLE',
  images: [],
};

describe('updateProductService — descuento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSetting.findUnique.mockResolvedValue({
      goldPricePerGram: dec(350000),
    });
  });

  it('rechaza un descuento mayor al precio actual', async () => {
    mockedProduct.findUnique.mockResolvedValue(baseProduct);

    // Precio = 350.000; descuento 400.000 > precio → debe lanzar.
    await expect(
      updateProductService('prod-uuid', { discountValue: '400000' }),
    ).rejects.toMatchObject({ code: 'BUSINESS_CONSTRAINT_FAILED' });

    expect(mockedProduct.update).not.toHaveBeenCalled();
  });

  it('rechaza un descuento negativo', async () => {
    mockedProduct.findUnique.mockResolvedValue(baseProduct);

    await expect(
      updateProductService('prod-uuid', { discountValue: '-100' }),
    ).rejects.toMatchObject({ code: 'BUSINESS_CONSTRAINT_FAILED' });

    expect(mockedProduct.update).not.toHaveBeenCalled();
  });

  it('acepta un descuento válido y devuelve finalPrice = precio - descuento', async () => {
    mockedProduct.findUnique.mockResolvedValue(baseProduct);
    mockedProduct.update.mockResolvedValue({
      ...baseProduct,
      discountValue: dec(100000),
    });

    const result = await updateProductService('prod-uuid', {
      discountValue: '100000',
    });

    expect(mockedProduct.update).toHaveBeenCalledTimes(1);
    expect(result.calculatedPrice).toBe(350000);
    expect(result.discountValue).toBe(100000);
    expect(result.finalPrice).toBe(250000);
  });

  it('permite descuento 0 (quitar descuento)', async () => {
    mockedProduct.findUnique.mockResolvedValue({
      ...baseProduct,
      discountValue: dec(100000),
    });
    mockedProduct.update.mockResolvedValue({
      ...baseProduct,
      discountValue: dec(0),
    });

    const result = await updateProductService('prod-uuid', {
      discountValue: '0',
    });

    expect(result.discountValue).toBe(0);
    expect(result.finalPrice).toBe(350000);
  });
});
