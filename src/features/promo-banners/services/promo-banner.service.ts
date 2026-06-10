import { prisma } from '../../../config/prisma';
import {
  ICreatePromoBannerDTO,
  IUpdatePromoBannerDTO,
  IReorderPromoBannerItem,
} from '../dtos/promo-banner.dto';

/**
 * Obtiene todos los banners de promoción ordenados por posición ascendente.
 */
export const findAllPromoBanners = () => {
  return prisma.promoBanner.findMany({
    orderBy: { position: 'asc' },
  });
};

/**
 * Busca un banner de promoción por su ID.
 */
export const findPromoBannerById = (id: number) => {
  return prisma.promoBanner.findUnique({
    where: { id },
  });
};

/**
 * Cuenta el número total de banners de promoción.
 */
export const countPromoBanners = () => {
  return prisma.promoBanner.count();
};

/**
 * Devuelve la posición máxima actual (0 si no hay banners).
 */
export const getMaxPromoBannerPosition = async (): Promise<number> => {
  const result = await prisma.promoBanner.aggregate({
    _max: { position: true },
  });
  return result._max.position ?? 0;
};

/**
 * Crea un nuevo banner de promoción.
 */
export const createPromoBanner = (data: ICreatePromoBannerDTO) => {
  return prisma.promoBanner.create({ data });
};

/**
 * Actualiza un banner de promoción existente.
 */
export const updatePromoBanner = (
  id: number,
  data: IUpdatePromoBannerDTO,
) => {
  return prisma.promoBanner.update({
    where: { id },
    data,
  });
};

/**
 * Elimina un banner y compacta las posiciones de los que iban después,
 * dentro de una transacción (mismo patrón que `removeFeaturedProductService`).
 */
export const deletePromoBannerAndShift = async (
  id: number,
  position: number,
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    await tx.promoBanner.delete({ where: { id } });

    const toShift = await tx.promoBanner.findMany({
      where: { position: { gt: position } },
      orderBy: { position: 'asc' },
      select: { id: true, position: true },
    });

    for (const item of toShift) {
      await tx.promoBanner.update({
        where: { id: item.id },
        data: { position: item.position - 1 },
      });
    }
  });
};

/**
 * Reordena la totalidad de los banners. Aplica el mismo truco de doble pasada
 * con posiciones negativas que `reorderFeaturedProductsService` para no violar
 * la restricción `@@unique([position])` durante el intercambio.
 */
export const reorderPromoBanners = async (
  items: IReorderPromoBannerItem[],
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.promoBanner.update({
        where: { id: item.id },
        data: { position: -item.position },
      });
    }
    for (const item of items) {
      await tx.promoBanner.update({
        where: { id: item.id },
        data: { position: item.position },
      });
    }
  });
};

/**
 * Verifica que un producto exista (para validar enlaces de tipo PRODUCT).
 */
export const productExists = async (id: string): Promise<boolean> => {
  const count = await prisma.product.count({ where: { id } });
  return count > 0;
};

/**
 * Verifica que una categoría exista (para validar enlaces de tipo CATEGORY).
 */
export const categoryExists = async (id: number): Promise<boolean> => {
  const count = await prisma.category.count({ where: { id } });
  return count > 0;
};
