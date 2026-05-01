import { prisma } from '../../../config/prisma';
import { UpsertBannerServiceDto } from '../dtos/update-banner.dto';

// A fixed ID to ensure we always operate on the same single row.
const BANNER_ID = 1;

/**
 * Finds the single banner record.
 * @returns The banner object or null if it doesn't exist.
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
 * Creates or updates the single banner record.
 * @param data - The data for the banner.
 * @returns The created or updated banner.
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
 * Deletes the single banner record.
 */
export const deleteBanner = async () => {
  // Use deleteMany to avoid an error if the record doesn't exist.
  return prisma.banner.deleteMany({
    where: { id: BANNER_ID },
  });
};
