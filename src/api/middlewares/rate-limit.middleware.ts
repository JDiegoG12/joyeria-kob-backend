import rateLimit from 'express-rate-limit';

/**
 * @file rate-limit.middleware.ts
 * @description Limitadores de tasa (rate limiting) para las rutas de
 * autenticación sensibles. Mitigan fuerza bruta de contraseñas, enumeración de
 * usuarios y abuso del envío de correos de recuperación.
 *
 * El conteo es por IP, por lo que la app debe confiar en la cabecera del proxy
 * inverso (Apache/Hostinger) para obtener la IP real del cliente; ver
 * `app.set('trust proxy', ...)` en `app.ts`.
 *
 * La respuesta al superar el límite reutiliza el formato de error estándar de la
 * API (`success`/`error`/`message`).
 */

/** Cuerpo JSON estandarizado que se devuelve al superar un límite (HTTP 429). */
const buildLimitMessage = (message: string) => ({
  success: false,
  error: 'TOO_MANY_REQUESTS',
  message,
});

/**
 * Limitador para login y registro: frena la fuerza bruta de credenciales y la
 * creación masiva de cuentas. 10 intentos por IP cada 15 minutos.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildLimitMessage(
    'Demasiados intentos. Inténtalo de nuevo en unos minutos.',
  ),
});

/**
 * Limitador más estricto para la recuperación de contraseña: evita el spam de
 * correos (que consume la cuota de Resend y daña la reputación de envío) y la
 * fuerza bruta del token de restablecimiento. 5 solicitudes por IP por hora.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildLimitMessage(
    'Demasiadas solicitudes de recuperación. Inténtalo de nuevo más tarde.',
  ),
});
