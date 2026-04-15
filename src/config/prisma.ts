import { PrismaClient } from '@prisma/client';

/**
 * Crea y exporta una única instancia de PrismaClient para ser utilizada
 * en toda la aplicación. Esto previene la creación de múltiples conexiones
 * a la base de datos, lo cual es una mala práctica y puede agotar el pool
 * de conexiones.
 *
 * Este patrón se conoce como Singleton.
 */
export const prisma = new PrismaClient();
