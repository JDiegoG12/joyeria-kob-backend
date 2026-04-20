import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { SystemSetting } from '../../../shared/models/system.model';

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
  return prisma.systemSetting.upsert({
    where: { id: SETTING_ID },
    update: { goldPricePerGram: price },
    create: { id: SETTING_ID, goldPricePerGram: price },
  });
};
