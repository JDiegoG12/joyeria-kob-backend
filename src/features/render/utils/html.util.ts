/**
 * @file html.util.ts
 * @description Utilidades para construir el HTML pre-renderizado que consumen
 * los crawlers: escape seguro, formato de precio, recorte de meta description y
 * la plantilla del documento completo (`<head>` con SEO + `<body>` en texto).
 *
 * El HTML no lleva CSS ni JS: solo lo lee un crawler. La prioridad es que
 * `<title>`, `<meta name="description">`, las etiquetas Open Graph, el JSON-LD y
 * el texto visible reflejen el contenido real de la página del frontend.
 */

import { SITE_NAME } from '../render.config';

/** Largo máximo recomendado para una meta description (alineado con el frontend). */
const META_DESCRIPTION_MAX = 155;

/**
 * Escapa los caracteres con significado en HTML para evitar romper el markup
 * (y prevenir inyección) cuando se interpola texto de la BD.
 */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Formatea un precio en pesos colombianos, igual que el frontend
 * (`$${price.toLocaleString('es-CO')}`). Se redondea para no mostrar decimales.
 */
export const formatPriceCOP = (price: number): string =>
  `$${new Intl.NumberFormat('es-CO').format(Math.round(price))}`;

/**
 * Normaliza y recorta un texto para usarlo como meta description, replicando
 * `truncateForMeta` del frontend (config/seo.ts): colapsa espacios y, si supera
 * el límite, corta en el último espacio y añade elipsis para no partir palabras.
 */
export const truncateForMeta = (
  text: string,
  max: number = META_DESCRIPTION_MAX,
): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const sliced = clean.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const trimmed = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;
  return `${trimmed.trimEnd()}…`;
};

/** Metadatos SEO de una página renderizada. */
export interface PageMeta {
  /** Contenido del `<title>` (ya con el sufijo de marca si corresponde). */
  title: string;
  /** Meta description (se recorta y escapa al construir el head). */
  description: string;
  /** URL canónica ABSOLUTA del FRONTEND (lo que indexa Google). */
  canonicalUrl: string;
  /** Tipo Open Graph. `website` para home/catálogo, `product` para el detalle. */
  ogType: 'website' | 'product';
  /** URL ABSOLUTA de la imagen para `og:image` (servida por este backend). */
  ogImage?: string;
  /** Si `true`, añade `noindex` (p. ej. producto no encontrado). */
  noindex?: boolean;
  /**
   * Datos estructurados JSON-LD (schema.org) a incrustar en el `<head>`.
   * Se serializa de forma segura dentro de `<script type="application/ld+json">`.
   */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Serializa un objeto a JSON seguro para incrustar dentro de un
 * `<script type="application/ld+json">`. El contenido se interpreta como JSON
 * (no como JavaScript), por lo que basta con neutralizar `<`, `>` y `&` —
 * escapados como secuencias `\uXXXX`, que siguen siendo JSON válido— para que
 * un eventual `</script>` o entidad en los datos no rompa la etiqueta ni el
 * documento HTML.
 */
const serializeJsonLd = (data: Record<string, unknown>): string =>
  JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

/**
 * Un view listo para renderizar: los metadatos SEO + el HTML del `<body>`.
 * Es lo que devuelven los builders de render.view; el pre-render lo usa para
 * componer el HTML final (shell de Vite + `buildSeoHead` + `body` en #root).
 */
export interface RenderView {
  meta: PageMeta;
  body: string;
}

/**
 * Construye SOLO el bloque de etiquetas SEO del `<head>` (title, description,
 * canonical, robots, Open Graph, Twitter, JSON-LD), SIN `charset`/`viewport`.
 *
 * Se extrae aparte de {@link renderHtmlPage} para reutilizarlo en dos destinos:
 *  - el documento HTML completo que sirven las rutas `/render`, y
 *  - el pre-render estático, que inyecta este bloque en el `<head>` del
 *    `index.html` real del frontend (que ya trae `charset`/`viewport` y los
 *    `<script>` con hash de Vite).
 *
 * Devuelve el markup indentado con 4 espacios, con un `<title>` propio para que
 * el consumidor reemplace el genérico del shell. No incluye salto final.
 */
export const buildSeoHead = (meta: PageMeta): string => {
  const description = truncateForMeta(meta.description);
  const safeTitle = escapeHtml(meta.title);
  const safeDescription = escapeHtml(description);
  const safeCanonical = escapeHtml(meta.canonicalUrl);

  const ogImageTag = meta.ogImage
    ? `\n    <meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`
    : '';
  const robotsTag = meta.noindex
    ? '\n    <meta name="robots" content="noindex" />'
    : '';

  // JSON-LD: admite un objeto o un arreglo; se emite un <script> por cada uno.
  const jsonLdBlocks = meta.jsonLd
    ? (Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd])
        .map(
          (block) =>
            `\n    <script type="application/ld+json">${serializeJsonLd(block)}</script>`,
        )
        .join('')
    : '';

  return `    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <link rel="canonical" href="${safeCanonical}" />${robotsTag}

    <!-- Open Graph -->
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:type" content="${meta.ogType}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${safeCanonical}" />${ogImageTag}

    <!-- Twitter -->
    <meta name="twitter:card" content="${meta.ogImage ? 'summary_large_image' : 'summary'}" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />${
      meta.ogImage
        ? `\n    <meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />`
        : ''
    }${jsonLdBlocks}`;
};

/**
 * Ensambla el documento HTML completo a partir de los metadatos y el cuerpo.
 * Reutiliza {@link buildSeoHead} para el `<head>`, de modo que el HTML de las
 * rutas `/render` y el `<head>` inyectado en el pre-render provienen de una
 * única fuente.
 *
 * @param meta - Metadatos SEO (title, description, canonical, og:*, jsonLd).
 * @param bodyHtml - HTML del `<body>` (contenido visible en texto plano).
 * @returns Documento HTML5 completo listo para enviarse al crawler.
 */
export const renderHtmlPage = (meta: PageMeta, bodyHtml: string): string =>
  `<!doctype html>
<html lang="es-CO">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${buildSeoHead(meta)}
  </head>
  <body>
${bodyHtml}
  </body>
</html>`;
