/**
 * @file render.config.ts
 * @description URLs públicas usadas para construir el HTML pre-renderizado.
 *
 * El HTML que sirve /render lo lee un crawler que está indexando el SITIO REAL
 * (el frontend). Por eso TODAS las URLs navegables que aparezcan en él
 * (`<link rel="canonical">`, `og:url`, enlaces internos) deben apuntar al
 * dominio del FRONTEND, no a este backend. De lo contrario Google indexaría
 * `api.joyeriakob.com/render/...` en vez de la URL que el usuario visita.
 *
 * Las imágenes (`og:image`, `<img>`) sí apuntan a este backend, porque los
 * archivos viven físicamente aquí, bajo `/uploads/products`.
 */

/** Quita la(s) barra(s) final(es) de una URL base para concatenar rutas sin dobles `/`. */
const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

/**
 * URL pública del FRONTEND (la que ve e indexa el usuario/crawler).
 * Configurable con `FRONTEND_PUBLIC_URL`. Debe ser el dominio canónico con
 * `www`, ya que es el que se usa para enlazar internamente y como canonical.
 */
export const FRONTEND_PUBLIC_URL = stripTrailingSlash(
  process.env.FRONTEND_PUBLIC_URL || 'https://www.joyeriakob.com',
);

/**
 * URL pública de ESTE backend, usada solo para construir las URLs absolutas de
 * las imágenes (`/uploads/...`). Configurable con `API_PUBLIC_URL`.
 */
export const API_PUBLIC_URL = stripTrailingSlash(
  process.env.API_PUBLIC_URL || 'https://api.joyeriakob.com',
);

/** Nombre de marca, alineado con `SITE_NAME` del frontend (config/seo.ts). */
export const SITE_NAME = 'Joyería KOB';

/** Construye una URL absoluta del frontend a partir de una ruta (`/catalogo`). */
export const frontendUrl = (path: string): string =>
  `${FRONTEND_PUBLIC_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Construye la URL absoluta de una imagen de producto servida por este backend. */
export const productImageUrl = (filename: string): string =>
  `${API_PUBLIC_URL}/uploads/products/${filename}`;
