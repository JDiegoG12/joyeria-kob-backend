/**
 * @file google-feed.xml.ts
 * @description Construcción del XML del feed de Google (RSS 2.0 con el namespace
 * `g` de Google Merchant). Mismo enfoque que `sitemap.xml.ts`: builders puros
 * que reciben los datos ya resueltos y solo se ocupan del formato y el escape.
 */

import type { GoogleFeedItem } from './google-feed.service';
import { FRONTEND_PUBLIC_URL, SITE_NAME } from '../render/render.config';

/**
 * Escapa los caracteres reservados en XML. Se aplica a TODO valor de texto
 * (título, descripción, URLs) para que un `&` en una descripción o una `"` no
 * rompan el documento.
 */
const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** Renderiza una etiqueta simple `<name>valor</name>` con el valor escapado. */
const tag = (name: string, value: string): string =>
  `      <${name}>${escapeXml(value)}</${name}>`;

/** Renderiza un `<item>` del feed con todos sus campos `g:*`. */
const renderItem = (item: GoogleFeedItem): string => {
  const lines: string[] = [
    tag('g:id', item.id),
    tag('g:title', item.title),
    tag('g:description', item.description),
    tag('g:link', item.link),
    tag('g:image_link', item.imageLink),
  ];

  for (const img of item.additionalImageLinks) {
    lines.push(tag('g:additional_image_link', img));
  }

  lines.push(tag('g:availability', item.availability));
  lines.push(tag('g:price', item.price));
  if (item.salePrice) {
    lines.push(tag('g:sale_price', item.salePrice));
  }
  lines.push(tag('g:brand', item.brand));
  lines.push(tag('g:condition', item.condition));
  lines.push(tag('g:identifier_exists', item.identifierExists));
  lines.push(
    tag('g:google_product_category', String(item.googleProductCategory)),
  );
  if (item.productType) {
    lines.push(tag('g:product_type', item.productType));
  }

  return `    <item>\n${lines.join('\n')}\n    </item>`;
};

/**
 * Construye el documento RSS 2.0 completo del feed a partir de los items.
 *
 * @param items - Productos públicos ya mapeados a items del feed.
 * @returns String XML con la declaración, el `<channel>` (title/link/description)
 *   y un `<item>` por producto.
 */
export const buildGoogleFeedXml = (items: GoogleFeedItem[]): string => {
  const itemsXml = items.map(renderItem).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(`${SITE_NAME} — Catálogo`)}</title>
    <link>${escapeXml(FRONTEND_PUBLIC_URL)}</link>
    <description>${escapeXml(`Catálogo de joyas de ${SITE_NAME}.`)}</description>
${itemsXml}
  </channel>
</rss>`;
};
