import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { calculateSuggestedPrice } from '../../../shared/utils/price-calculator';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { ReorderFeaturedProductsDto } from '../dtos/featured-product.dto';
import { FeaturedProductWithPrice } from '../ports/featured-product.ports';

const MAX_FEATURED_PRODUCTS = 6;
const DEFAULT_GOLD_PRICE = 350000;

type FeaturedProductWithProduct = Prisma.FeaturedProductGetPayload<{
  include: { product: true };
}>;

const getGoldPrice = async (): Promise<number> => {
  const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  return settings?.goldPricePerGram.toNumber() ?? DEFAULT_GOLD_PRICE;
};

const mapFeaturedWithPrice = (
  item: FeaturedProductWithProduct,
  goldPrice: number,
): FeaturedProductWithPrice => {
  const calculatedPrice = calculateSuggestedPrice(
    item.product.baseWeight.toNumber(),
    goldPrice,
    item.product.additionalValue.toNumber(),
  );
  const discountValue = item.product.discountValue.toNumber();
  return {
    ...item,
    product: {
      ...item.product,
      calculatedPrice,
      discountValue,
      finalPrice: Math.max(calculatedPrice - discountValue, 0),
    },
  };
};

const getPositionSet = (items: ReorderFeaturedProductsDto) =>
  new Set(items.map((item) => item.position));

const getProductIdSet = (items: ReorderFeaturedProductsDto) =>
  new Set(items.map((item) => item.productId));

const arePositionsContiguous = (items: ReorderFeaturedProductsDto): boolean => {
  const sorted = [...items].map((item) => item.position).sort((a, b) => a - b);
  return sorted.every((value, index) => value === index + 1);
};

export const getFeaturedProductsService = async (): Promise<
  FeaturedProductWithPrice[]
> => {
  const featuredProducts = await prisma.featuredProduct.findMany({
    include: { product: true },
    orderBy: { position: 'asc' },
  });

  if (featuredProducts.length === 0) {
    return [];
  }

  const goldPrice = await getGoldPrice();
  return featuredProducts.map((item) => mapFeaturedWithPrice(item, goldPrice));
};

export const addFeaturedProductService = async (
  productId: string,
): Promise<FeaturedProductWithPrice> => {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw {
      code: ERROR_CODES.PRODUCT_NOT_FOUND,
      status: 404,
      message: 'La joya solicitada no existe.',
    };
  }

  if (product.status !== 'AVAILABLE') {
    throw {
      code: ERROR_CODES.BUSINESS_CONSTRAINT_FAILED,
      status: 400,
      message: 'Solo se pueden destacar productos disponibles.',
    };
  }

  const alreadyFeatured = await prisma.featuredProduct.findUnique({
    where: { productId },
  });

  if (alreadyFeatured) {
    throw {
      code: ERROR_CODES.BUSINESS_CONSTRAINT_FAILED,
      status: 409,
      message: 'El producto ya esta destacado.',
    };
  }

  const count = await prisma.featuredProduct.count();
  if (count >= MAX_FEATURED_PRODUCTS) {
    throw {
      code: ERROR_CODES.BUSINESS_CONSTRAINT_FAILED,
      status: 400,
      message: 'No se pueden agregar mas de 6 productos destacados.',
    };
  }

  const maxPosition = await prisma.featuredProduct.aggregate({
    _max: { position: true },
  });
  const nextPosition = (maxPosition._max.position ?? 0) + 1;

  if (nextPosition > MAX_FEATURED_PRODUCTS) {
    throw {
      code: ERROR_CODES.BUSINESS_CONSTRAINT_FAILED,
      status: 400,
      message: 'No hay posiciones disponibles para destacar.',
    };
  }

  const created = await prisma.featuredProduct.create({
    data: { productId, position: nextPosition },
    include: { product: true },
  });

  const goldPrice = await getGoldPrice();
  return mapFeaturedWithPrice(created, goldPrice);
};

export const removeFeaturedProductService = async (
  productId: string,
): Promise<void> => {
  const existing = await prisma.featuredProduct.findUnique({
    where: { productId },
  });

  if (!existing) {
    throw {
      code: ERROR_CODES.NOT_FOUND,
      status: 404,
      message: 'El producto destacado no existe.',
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.featuredProduct.delete({ where: { productId } });

    const toShift = await tx.featuredProduct.findMany({
      where: { position: { gt: existing.position } },
      orderBy: { position: 'asc' },
      select: { productId: true, position: true },
    });

    for (const item of toShift) {
      await tx.featuredProduct.update({
        where: { productId: item.productId },
        data: { position: item.position - 1 },
      });
    }
  });
};

export const reorderFeaturedProductsService = async (
  items: ReorderFeaturedProductsDto,
): Promise<FeaturedProductWithPrice[]> => {
  const productIds = items.map((item) => item.productId);

  if (getProductIdSet(items).size !== items.length) {
    throw {
      code: ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      message: 'No se permiten productId duplicados en el reordenamiento.',
    };
  }

  if (getPositionSet(items).size !== items.length) {
    throw {
      code: ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      message: 'No se permiten posiciones duplicadas en el reordenamiento.',
    };
  }

  if (!arePositionsContiguous(items)) {
    throw {
      code: ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      message: 'Las posiciones deben ser consecutivas iniciando en 1.',
    };
  }

  const totalFeatured = await prisma.featuredProduct.count();
  if (items.length !== totalFeatured) {
    throw {
      code: ERROR_CODES.VALIDATION_ERROR,
      status: 400,
      message:
        'Debe enviar todos los productos destacados para poder reordenar.',
    };
  }

  const existing = await prisma.featuredProduct.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true },
  });

  if (existing.length !== productIds.length) {
    throw {
      code: ERROR_CODES.NOT_FOUND,
      status: 404,
      message: 'Uno o mas productos destacados no existen.',
    };
  }

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.featuredProduct.update({
        where: { productId: item.productId },
        data: { position: -item.position },
      });
    }

    for (const item of items) {
      await tx.featuredProduct.update({
        where: { productId: item.productId },
        data: { position: item.position },
      });
    }
  });

  return getFeaturedProductsService();
};
