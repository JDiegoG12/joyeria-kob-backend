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

/**
 * Obtiene el precio actual del oro por gramo desde la configuración del sistema.
 * Si no hay configuración registrada, usa el valor por defecto.
 *
 * @returns Precio del oro por gramo a usar en el cálculo de precios.
 */
const getGoldPrice = async (): Promise<number> => {
  const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  return settings?.goldPricePerGram.toNumber() ?? DEFAULT_GOLD_PRICE;
};

/**
 * Enriquece un favorito con el precio calculado y el precio final de su producto.
 *
 * @param favorite - Favorito con el producto y su categoría incluidos.
 * @param goldPrice - Precio del oro por gramo usado en el cálculo.
 * @returns El favorito con `calculatedPrice`, `discountValue` y `finalPrice`.
 */
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

/**
 * Agrega un producto a los favoritos de un usuario.
 *
 * Valida que el producto exista y esté disponible, y que no esté ya en los
 * favoritos del usuario (controlando también la colisión por la restricción
 * única a nivel de base de datos).
 *
 * @param userId - ID del usuario.
 * @param productId - ID del producto a marcar como favorito.
 * @returns El favorito recién creado.
 * @throws Un error de negocio con `code`/`status`/`message` si el producto no
 *   existe (404), no está disponible (400) o ya es favorito (409).
 */
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

/**
 * Elimina un producto de los favoritos de un usuario.
 *
 * @param userId - ID del usuario.
 * @param productId - ID del producto a quitar de favoritos.
 * @returns `true` si la eliminación fue exitosa.
 * @throws Un error de negocio (404) si el producto no estaba en los favoritos.
 */
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
