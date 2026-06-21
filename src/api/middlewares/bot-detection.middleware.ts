import { Request, Response, NextFunction } from 'express';
import { isbot } from 'isbot';

/**
 * Request enriquecida con el resultado de la detección de bots.
 *
 * Se sigue el mismo patrón que `AuthenticatedRequest` (ver auth.middleware.ts):
 * se extiende `Request` con una propiedad opcional en lugar de usar
 * declaration merging global, para mantener la augmentación acotada y explícita.
 */
export interface BotAwareRequest extends Request {
  /** `true` si el `User-Agent` corresponde a un crawler/bot conocido. */
  isBot?: boolean;
}

/**
 * Middleware de detección de bots basado en la librería `isbot`.
 *
 * `isbot` mantiene una lista actualizada de user-agents de crawlers (Googlebot,
 * Bingbot, Slurp, DuckDuckBot, facebookexternalhit, Twitterbot, WhatsApp,
 * LinkedInBot, etc.), por lo que evita mantener la expresión regular a mano.
 *
 * Responsabilidad: leer el header `User-Agent`, calcular si es un bot y
 * adjuntar el resultado en `req.isBot`. No bloquea ni redirige: la decisión de
 * enrutamiento (servir SPA vs. servir HTML pre-renderizado) la toma Apache del
 * lado del frontend (ver el fragmento de .htaccess en el README/resumen). Aquí
 * solo se expone la señal para poder:
 *   - registrar/depurar el origen de las peticiones a /render,
 *   - exponer un header de diagnóstico (`X-Rendered-For`),
 *   - construir, en el futuro, lógica condicional adicional si hiciera falta.
 *
 * Es deliberadamente NO restrictivo: las rutas /render responden HTML a
 * cualquier cliente (incluido `curl` o un navegador) para poder probarlas
 * manualmente sin falsear el User-Agent.
 */
export const detectBot = (
  req: BotAwareRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const userAgent = req.headers['user-agent'] || '';
  req.isBot = isbot(userAgent);
  next();
};
