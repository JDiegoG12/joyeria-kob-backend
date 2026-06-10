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

/**
 * Obtiene el precio actual del oro por gramo desde la configuración del sistema,
 * o el valor por defecto si no hay configuración registrada.
 */
const getGoldPrice = async (): Promise<number> => {
  const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  return settings?.goldPricePerGram.toNumber() ?? DEFAULT_GOLD_PRICE;
};

/**
 * Enriquece un producto destacado con el precio calculado y el precio final.
 *
 * @param item - Producto destacado con su producto incluido.
 * @param goldPrice - Precio del oro por gramo usado en el cálculo.
 * @returns El destacado con `calculatedPrice`, `discountValue` y `finalPrice`.
 */
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

/** Devuelve el conjunto de posiciones presentes en la solicitud de reorden. */
const getPositionSet = (items: ReorderFeaturedProductsDto) =>
  new Set(items.map((item) => item.position));

/** Devuelve el conjunto de productIds presentes en la solicitud de reorden. */
const getProductIdSet = (items: ReorderFeaturedProductsDto) =>
  new Set(items.map((item) => item.productId));

/**
 * Comprueba que las posiciones formen una secuencia contigua iniciando en 1
 * (1, 2, 3, ...), sin huecos ni repeticiones.
 */
const arePositionsContiguous = (items: ReorderFeaturedProductsDto): boolean => {
  const sorted = [...items].map((item) => item.position).sort((a, b) => a - b);
  return sorted.every((value, index) => value === index + 1);
};

/**
 * Obtiene los productos destacados ordenados por posición, cada uno con su
 * precio calculado.
 *
 * @returns Lista de productos destacados con precios, o un arreglo vacío.
 */
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

/**
 * Agrega un producto a la lista de destacados, asignándole la siguiente posición
 * libre.
 *
 * Valida que el producto exista y esté disponible, que no esté ya destacado y
 * que no se supere el máximo permitido (6).
 *
 * @param productId - ID del producto a destacar.
 * @returns El producto destacado creado, con su precio calculado.
 * @throws Un error de negocio si el producto no existe (404), no está disponible
 *   (400), ya está destacado (409) o se alcanzó el límite (400).
 */
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

/**
 * Quita un producto de los destacados y compacta las posiciones de los
 * restantes para que no queden huecos. Toda la operación es transaccional.
 *
 * @param productId - ID del producto destacado a eliminar.
 * @throws Un error de negocio (404) si el producto no estaba destacado.
 */
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

/**
 * Reordena por completo la lista de productos destacados.
 *
 * Valida que no haya productIds ni posiciones duplicados, que las posiciones
 * sean contiguas desde 1, que se envíen todos los destacados existentes y que
 * todos los productos referenciados existan. La reasignación se hace en dos
 * pasos dentro de una transacción (posiciones negativas temporales) para no
 * violar la restricción de posición única.
 *
 * @param items - Lista completa de destacados con su nueva posición.
 * @returns La lista de destacados ya reordenada, con precios calculados.
 * @throws Un error de validación (400) o de no encontrado (404) según el caso.
 */
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
