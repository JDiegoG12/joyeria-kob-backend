import { PrismaClient, Prisma } from '@prisma/client';

// --- Configuración del Mecanismo de Reintento ---
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000; // 1 segundo

/**
 * Comprueba si un error es un error de conexión transitorio que puede ser reintentado.
 * @param e - El error capturado.
 * @returns `true` si es un error de conexión conocido, `false` en caso contrario.
 */
function isConnectionError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1017: Server has closed the connection
    if (['P1001', 'P1017'].includes(e.code)) {
      return true;
    }
  }
  if (e instanceof Error) {
    const message = e.message.toLowerCase();
    // Errores genéricos de conexión o timeouts que mencionaste
    return (
      message.includes('timer has gone away') ||
      message.includes("can't reach database server") ||
      message.includes('timed out fetching a new connection')
    );
  }
  return false;
}

/**
 * Crea y exporta una única instancia de PrismaClient con un middleware de reconexión automática.
 *
 * Este patrón Singleton se enriquece con un middleware que intercepta cada operación
 * y, en caso de un error de conexión conocido, intenta la operación varias veces
 * con un backoff exponencial antes de fallar definitivamente.
 */
const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      // Intenta ejecutar la operación de Prisma
      return await next(params);
    } catch (e) {
      // Si el error no es de conexión, lo lanzamos inmediatamente.
      if (!isConnectionError(e)) {
        throw e;
      }

      attempt++;
      console.error(
        `[Prisma Reconnect] Error de conexión detectado. Intento ${attempt} de ${MAX_RETRIES}.`,
        (e as Error).message,
      );

      // Si se superan los reintentos, se lanza el error final.
      if (attempt > MAX_RETRIES) {
        console.error(
          '[Prisma Reconnect] No se pudo recuperar la conexión a la base de datos después de varios intentos.',
        );
        throw e;
      }

      // Espera exponencial con un poco de "jitter" (aleatoriedad)
      const backoffTime =
        INITIAL_BACKOFF_MS * 2 ** (attempt - 1) + Math.random() * 100;
      console.log(
        `[Prisma Reconnect] Esperando ${backoffTime.toFixed(0)}ms para el siguiente reintento...`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }
  // Este punto teóricamente no debería alcanzarse, pero TypeScript lo requiere para satisfacer el path de retorno.
  throw new Error(
    'Se superaron los reintentos de conexión a la base de datos.',
  );
});

export { prisma };
