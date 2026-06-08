import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { calculateSuggestedPrice } from '../../../shared/utils/price-calculator';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { FavoriteWithProduct } from '../ports/favorite.ports';

const DEFAULT_GOLD_PRICE = 350000;

type FavoriteWithProductPayload = Prisma.FavoriteGetPayload<{
  include: {
    product: { include: { category: { include: { parent: true } } } };
  };
}>;

const getGoldPrice = async (): Promise<number> => {
  const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  return settings?.goldPricePerGram.toNumber() ?? DEFAULT_GOLD_PRICE;
};

const mapFavoriteWithPrice = (
  favorite: FavoriteWithProductPayload,
  goldPrice: number,
): FavoriteWithProduct => {
  const calculatedPrice = calculateSuggestedPrice(
    favorite.product.baseWeight.toNumber(),
    goldPrice,
    favorite.product.additionalValue.toNumber(),
  );
  const discountValue = favorite.product.discountValue.toNumber();
  return {
    ...favorite,
    product: {
      ...favorite.product,
      calculatedPrice,
      discountValue,
      finalPrice: Math.max(calculatedPrice - discountValue, 0),
    },
  };
};

/**
 * Obtiene los favoritos de un usuario, incluyendo el producto con su precio
 * calculado.
 *
 * @param userId - ID del usuario dueño de los favoritos.
 * @param options.onlyAvailable - Si es `true` (valor por defecto) solo se
 *   devuelven favoritos cuyo producto está `AVAILABLE` (vista de tienda). El
 *   panel administrativo lo invoca con `false` para ver TODOS los favoritos del
 *   cliente, sin importar el estado del producto.
 * @returns Lista de favoritos con el producto y su precio final.
 */
export const getUserFavoritesService = async (
  userId: string,
  options: { onlyAvailable?: boolean } = {},
): Promise<FavoriteWithProduct[]> => {
  const { onlyAvailable = true } = options;

  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      ...(onlyAvailable && { product: { status: 'AVAILABLE' } }),
    },
    include: {
      product: { include: { category: { include: { parent: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (favorites.length === 0) {
    return [];
  }

  const goldPrice = await getGoldPrice();
  return favorites.map((favorite) => mapFavoriteWithPrice(favorite, goldPrice));
};

export const addFavoriteService = async (userId: string, productId: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw {
      code: ERROR_CODES.PRODUCT_NOT_FOUND,
      status: 404,
      message: 'El producto no existe.',
    };
  }

  if (product.status !== 'AVAILABLE') {
    throw {
      code: ERROR_CODES.BUSINESS_CONSTRAINT_FAILED,
      status: 400,
      message: 'El producto no esta disponible.',
    };
  }

  const existing = await prisma.favorite.findUnique({
    where: { unique_user_product: { userId, productId } },
  });

  if (existing) {
    throw {
      code: ERROR_CODES.FAVORITE_ALREADY_EXISTS,
      status: 409,
      message: 'Este producto ya esta en tus favoritos.',
    };
  }

  try {
    return await prisma.favorite.create({
      data: { userId, productId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw {
        code: ERROR_CODES.FAVORITE_ALREADY_EXISTS,
        status: 409,
        message: 'Este producto ya esta en tus favoritos.',
      };
    }
    throw error;
  }
};

export const removeFavoriteService = async (
  userId: string,
  productId: string,
): Promise<boolean> => {
  const existing = await prisma.favorite.findUnique({
    where: { unique_user_product: { userId, productId } },
  });

  if (!existing) {
    throw {
      code: ERROR_CODES.FAVORITE_NOT_FOUND,
      status: 404,
      message: 'El producto no esta en tus favoritos.',
    };
  }

  await prisma.favorite.delete({
    where: { id: existing.id },
  });

  return true;
};
