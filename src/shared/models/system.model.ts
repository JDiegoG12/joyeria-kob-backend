import { SystemSetting as PrismaSystemSetting } from '@prisma/client';

/**
 * Configuración global del sistema (alias del modelo generado por Prisma).
 *
 * Reexporta el tipo `SystemSetting` de Prisma para que el resto de la aplicación
 * dependa de este alias de dominio en lugar del cliente de Prisma directamente.
 */
export type SystemSetting = PrismaSystemSetting;
