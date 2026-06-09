import { PrismaClient, Prisma } from '@prisma/client';

// --- Configuración del Mecanismo de Reintento ---
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000; // 1 segundo

/**
 * Comprueba si el error es un "PANIC" irrecuperable del motor de Prisma.
 * @param e El error capturado.
 * @returns `true` si es un error de pánico, `false` en caso contrario.
 */
function isPanicError(e: unknown): boolean {
  if (e instanceof Error) {
    return e.message.toLowerCase().includes('timer has gone away');
  }
  return false;
}

/**
 * Comprueba si un error es de conexión transitorio y reintentable.
 * Excluye explícitamente los errores de pánico.
 * @param e El error capturado.
 * @returns `true` si es un error de conexión reintentable.
 */
function isRetryableConnectionError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: Can't reach database server
    // P1017: Server has closed the connection
    return ['P1001', 'P1017'].includes(e.code);
  }
  if (e instanceof Error) {
    const message = e.message.toLowerCase();
    // Errores genéricos de conexión o timeouts
    return (
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
 *
 * Manejo de Errores:
 * 1. **PANIC Irrecuperable**: Si detecta "timer has gone away", fuerza la desconexión
 *    y lanza un error para que un supervisor externo (PM2, Hostinger) reinicie la app.
 * 2. **Error de Conexión Reintentable**: Para otros errores de red, reintenta la
 *    operación varias veces.
 */

/**
 * Flag para asegurar que $disconnect() solo se llame una vez en caso de pánico,
 * evitando race conditions si múltiples queries fallan simultáneamente.
 */
let isDisconnecting = false;
const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Intenta ejecutar la operación de Prisma
      return await next(params);
    } catch (e) {
      // 1. Manejo de error PANIC (irrecuperable)
      if (isPanicError(e)) {
        if (!isDisconnecting) {
          isDisconnecting = true;
          console.error(
            '[Prisma PANIC] Error irrecuperable del motor de Prisma detectado. Forzando desconexión para reinicio de la aplicación.',
          );
          // Intenta desconectar para limpiar, pero no es crítico si falla.
          await prisma.$disconnect().catch((disconnectError) => {
            console.error(
              '[Prisma PANIC] Error adicional al intentar desconectar el cliente:',
              disconnectError,
            );
          });
        }
        // Lanza un error fatal para que el supervisor reinicie el proceso.
        throw new Error(
          'Prisma Query Engine PANIC. Se requiere reinicio del servidor.',
        );
      }

      // 2. Si no es PANIC, comprobar si es un error de conexión reintentable.
      // Si no es reintentable o ya es el último intento, lanzar el error.
      if (!isRetryableConnectionError(e) || attempt === MAX_RETRIES) {
        if (attempt === MAX_RETRIES && isRetryableConnectionError(e)) {
          console.error(
            '[Prisma Reconnect] No se pudo recuperar la conexión a la base de datos después de varios intentos.',
          );
        }
        throw e;
      }

      console.error(
        `[Prisma Reconnect] Error de conexión reintentable detectado. Reintento ${attempt} de ${MAX_RETRIES}.`,
        (e as Error).message,
      );

      // Espera exponencial con un poco de "jitter" (aleatoriedad)
      const backoffTime =
        INITIAL_BACKOFF_MS * 2 ** (attempt - 1) + Math.random() * 200;
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
