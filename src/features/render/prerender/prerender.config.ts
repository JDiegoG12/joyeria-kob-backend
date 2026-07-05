/**
 * @file prerender.config.ts
 * @description Rutas de salida del pre-render. Como frontend y backend comparten
 * filesystem (mismo usuario Linux en Hostinger), el backend escribe los HTML
 * directamente en el `public_html` público del frontend.
 *
 * La ruta base es configurable con `FRONTEND_PUBLIC_DIR` para no hardcodear la
 * ruta absoluta del hosting en el código (útil también para pruebas locales).
 */

import path from 'node:path';

/**
 * Directorio público del FRONTEND (donde Apache/LiteSpeed sirve los archivos).
 * En producción: `/home/u708472935/domains/joyeriakob.com/public_html`.
 */
export const FRONTEND_PUBLIC_DIR =
  process.env.FRONTEND_PUBLIC_DIR ||
  '/home/u708472935/domains/joyeriakob.com/public_html';

/** `index.html` shell de Vite: plantilla base del pre-render (nunca se toca). */
export const SHELL_PATH = path.join(FRONTEND_PUBLIC_DIR, 'index.html');

/** Subcarpeta con los HTML pre-renderizados (home, catalogo, informacion, producto). */
export const PRERENDER_DIR = path.join(FRONTEND_PUBLIC_DIR, 'prerender');

/** `sitemap.xml` en la raíz del público (mismo host que las URLs que lista). */
export const SITEMAP_PATH = path.join(FRONTEND_PUBLIC_DIR, 'sitemap.xml');
