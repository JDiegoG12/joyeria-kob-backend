/**
 * @file sitemap.xml.ts
 * @description Construcción del XML del sitemap (urlset) con soporte para el
 * sitemap de imágenes de Google. No se incluye `<lastmod>`: el modelo Product
 * no tiene `updatedAt`, y la instrucción es omitir el tag antes que inventar
 * una fecha.
 */

import { SitemapEntry } from './sitemap.service';

/**
 * Escapa los caracteres reservados en XML para los valores de URL.
 * Los `<loc>` casi nunca los contienen (UUID + nombre de archivo), pero el `&`
 * en una eventual query rompería el XML; se escapa por seguridad.
 */
const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** Renderiza las etiquetas de imagen (`image:image`) de una entrada. */
const renderImages = (images: string[]): string =>
  images
    .map(
      (img) =>
        `\n    <image:image><image:loc>${escapeXml(img)}</image:loc></image:image>`,
    )
    .join('');

/** Renderiza una entrada `<url>` con sus imágenes. */
const renderUrl = (entry: SitemapEntry): string =>
  `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${renderImages(entry.images)}
  </url>`;

/**
 * Construye el documento XML completo del sitemap a partir de las entradas.
 *
 * @param entries - Páginas estáticas + productos (con sus imágenes).
 * @returns String XML con la declaración, el `urlset` y los namespaces de
 *   sitemap (0.9) e imágenes (1.1).
 */
export const buildSitemapXml = (entries: SitemapEntry[]): string => {
  const urls = entries.map(renderUrl).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
};
