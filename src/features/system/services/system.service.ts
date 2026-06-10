import { prisma } from '../../../config/prisma';
import { Prisma, SystemSetting, GoldPriceHistory } from '@prisma/client';

const SETTING_ID = 1;

/**
 * Obtiene la configuración actual del precio del oro.
 * @returns La configuración del sistema o null si no existe.
 */
export const getGoldPriceSetting = async (): Promise<SystemSetting | null> => {
  return prisma.systemSetting.findUnique({
    where: { id: SETTING_ID },
  });
};

/**
 * Actualiza o crea la configuración del precio del oro.
 * @param price - El nuevo precio del oro por gramo.
 * @returns La configuración del sistema actualizada.
 */
export const upsertGoldPriceSetting = async (
  price: Prisma.Decimal,
): Promise<SystemSetting> => {
  return prisma.$transaction(async (tx) => {
    // 1. Actualizar o crear la configuración global
    const updatedSetting = await tx.systemSetting.upsert({
      where: { id: SETTING_ID },
      update: { goldPricePerGram: price },
      create: { id: SETTING_ID, goldPricePerGram: price },
    });

    // 2. Insertar automáticamente en la tabla de historial
    await tx.goldPriceHistory.create({
      data: { goldPricePerGram: price },
    });

    return updatedSetting;
  });
};

/**
 * Obtiene el historial completo de los cambios de precio del oro.
 * Ideal para el módulo de métricas.
 *
 * @returns Un arreglo con el historial ordenado de más reciente a más antiguo.
 */
export const getGoldPriceHistoryService = async (): Promise<
  GoldPriceHistory[]
> => {
  return prisma.goldPriceHistory.findMany({
    orderBy: { createdAt: 'desc' },
  });
};
