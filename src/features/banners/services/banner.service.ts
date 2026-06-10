import { prisma } from '../../../config/prisma';
import { UpsertBannerServiceDto } from '../dtos/update-banner.dto';

// ID fijo para operar siempre sobre el único registro de banner.
const BANNER_ID = 1;

/**
 * Busca el único registro de banner.
 * @returns El banner o `null` si no existe.
 */
export const findBanner = async () => {
  return prisma.banner.findUnique({
    where: { id: BANNER_ID },
    select: {
      id: true,
      title: true,
      subtitle: true,
      imageUrl: true,
      updatedAt: true,
    },
  });
};

/**
 * Crea o actualiza el único registro de banner.
 * @param data - Datos del banner (título, subtítulo e imagen).
 * @returns El banner creado o actualizado.
 */
export const upsertBanner = async (data: UpsertBannerServiceDto) => {
  const { title, subtitle, imageUrl } = data;
  return prisma.banner.upsert({
    where: { id: BANNER_ID },
    update: {
      title,
      subtitle,
      imageUrl,
    },
    create: {
      id: BANNER_ID,
      title,
      subtitle,
      imageUrl,
    },
  });
};

/**
 * Elimina el único registro de banner.
 */
export const deleteBanner = async () => {
  // Se usa deleteMany para no fallar si el registro no existe.
  return prisma.banner.deleteMany({
    where: { id: BANNER_ID },
  });
};
