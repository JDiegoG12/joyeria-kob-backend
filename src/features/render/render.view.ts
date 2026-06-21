/**
 * @file render.view.ts
 * @description Construcción del HTML de cada página pre-renderizada a partir de
 * los view-models de render.service.ts. Todo el texto interpolado se escapa y
 * todas las URLs navegables apuntan al dominio del FRONTEND (ver render.config).
 *
 * El HTML es intencionalmente simple (sin CSS/JS): solo lo lee un crawler. Lo
 * que importa es que `<title>`, la meta description, las etiquetas Open Graph y
 * el texto visible reflejen el contenido real de la página del frontend.
 */

import {
  RenderHomeData,
  RenderProductCard,
  RenderProductDetail,
} from './render.service';
import {
  escapeHtml,
  formatPriceCOP,
  renderHtmlPage,
  PageMeta,
} from './utils/html.util';
import { frontendUrl, SITE_NAME } from './render.config';
import {
  buildOrganizationJsonLd,
  buildProductJsonLd,
} from './utils/json-ld';

/** Descripción de la home (alineada con el `<meta>` de home-page.tsx). */
const HOME_DESCRIPTION =
  'Diseñamos y fabricamos joyas de oro 18k a la medida: anillos, collares, dijes y pulseras personalizadas. Pide tu diseño único en Joyería KOB.';

/** Descripción del catálogo. */
const CATALOG_DESCRIPTION =
  'Explora el catálogo de joyas de oro 18k de Joyería KOB: anillos, collares, dijes y pulseras. Diseños personalizados hechos a la medida.';

/** Renderiza un enlace de producto como ítem de lista con su precio. */
const renderProductListItem = (card: RenderProductCard): string => {
  const price = card.hasDiscount
    ? `${formatPriceCOP(card.finalPrice)} (antes ${formatPriceCOP(card.calculatedPrice)})`
    : formatPriceCOP(card.calculatedPrice);
  const category = card.categoryName
    ? ` — ${escapeHtml(card.categoryName)}`
    : '';
  return `      <li>
        <a href="${escapeHtml(frontendUrl(card.path))}">${escapeHtml(card.name)}</a>
        <span> — ${escapeHtml(price)}</span>${category}
      </li>`;
};

/**
 * HTML de `/render/home`: marca, descripción, categorías y destacados.
 */
export const buildHomeHtml = (data: RenderHomeData): string => {
  const meta: PageMeta = {
    title: `${SITE_NAME} | Joyas de oro 18k personalizadas en El Bordo`,
    description: HOME_DESCRIPTION,
    canonicalUrl: frontendUrl('/'),
    ogType: 'website',
    ogImage: data.featured[0]?.imageUrl ?? undefined,
    // JSON-LD de la organización (marca) — misma estructura que el frontend.
    jsonLd: buildOrganizationJsonLd(),
  };

  const categoriesHtml =
    data.categories.length > 0
      ? `    <h2>Categorías</h2>
    <ul>
${data.categories
  .map(
    (category) =>
      `      <li><a href="${escapeHtml(
        frontendUrl(`/catalogo?categoria=${category.id}`),
      )}">${escapeHtml(category.name)}</a></li>`,
  )
  .join('\n')}
    </ul>`
      : '';

  const featuredHtml =
    data.featured.length > 0
      ? `    <h2>Productos destacados</h2>
    <ul>
${data.featured.map(renderProductListItem).join('\n')}
    </ul>`
      : '';

  const body = `    <h1>${escapeHtml(SITE_NAME)}</h1>
    <p>${escapeHtml(HOME_DESCRIPTION)}</p>
    <p><a href="${escapeHtml(frontendUrl('/catalogo'))}">Ver catálogo completo</a></p>
${categoriesHtml}
${featuredHtml}`;

  return renderHtmlPage(meta, body);
};

/**
 * HTML de `/render/catalogo`: listado de todos los productos disponibles.
 */
export const buildCatalogHtml = (products: RenderProductCard[]): string => {
  const meta: PageMeta = {
    title: `Catálogo | ${SITE_NAME}`,
    description: CATALOG_DESCRIPTION,
    canonicalUrl: frontendUrl('/catalogo'),
    ogType: 'website',
    ogImage: products[0]?.imageUrl ?? undefined,
  };

  const listHtml =
    products.length > 0
      ? `    <ul>
${products.map(renderProductListItem).join('\n')}
    </ul>`
      : '    <p>No hay productos disponibles en este momento.</p>';

  const body = `    <h1>Catálogo de ${escapeHtml(SITE_NAME)}</h1>
    <p>${escapeHtml(CATALOG_DESCRIPTION)}</p>
    <p>${products.length} producto(s) disponible(s).</p>
${listHtml}`;

  return renderHtmlPage(meta, body);
};

/**
 * HTML de `/render/producto/:slug`: detalle completo de la joya.
 */
export const buildProductHtml = (product: RenderProductDetail): string => {
  const description =
    product.description?.trim() ||
    `${product.name} en oro 18k, diseño personalizado de ${SITE_NAME}.`;

  const canonicalUrl = frontendUrl(product.path);
  const meta: PageMeta = {
    title: `${product.name} | ${SITE_NAME}`,
    description,
    // og:url / canonical apuntan a la URL real del frontend (slug canónico).
    canonicalUrl,
    ogType: 'product',
    ogImage: product.imageUrl ?? undefined,
    // JSON-LD del producto — misma estructura de datos que el frontend.
    jsonLd: buildProductJsonLd({
      name: product.name,
      description,
      images: product.imageUrls,
      sku: product.id,
      // Precio numérico sin separadores de miles (lo que paga el cliente).
      price: Math.round(product.finalPrice),
      inStock: product.inStock,
      url: canonicalUrl,
    }),
  };

  const priceHtml = product.hasDiscount
    ? `    <p>Precio: ${escapeHtml(formatPriceCOP(product.finalPrice))} (antes ${escapeHtml(
        formatPriceCOP(product.calculatedPrice),
      )})</p>`
    : `    <p>Precio: ${escapeHtml(formatPriceCOP(product.calculatedPrice))}</p>`;

  const categoryHtml = product.categoryName
    ? `    <p>Categoría: ${escapeHtml(product.categoryName)}</p>`
    : '';

  const imageHtml = product.imageUrl
    ? `    <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" />`
    : '';

  const body = `    <h1>${escapeHtml(product.name)}</h1>
${imageHtml}
${categoryHtml}
${priceHtml}
    <p>${escapeHtml(description)}</p>
    <p>Marca: ${escapeHtml(SITE_NAME)}</p>
    <p><a href="${escapeHtml(frontendUrl('/catalogo'))}">Volver al catálogo</a></p>`;

  return renderHtmlPage(meta, body);
};

/**
 * HTML de "no encontrado" (404) para slugs inválidos o productos inexistentes.
 * Lleva `noindex` para que el crawler no indexe la página de error.
 */
export const buildNotFoundHtml = (): string => {
  const meta: PageMeta = {
    title: `Página no encontrada | ${SITE_NAME}`,
    description: 'El contenido solicitado no está disponible.',
    canonicalUrl: frontendUrl('/'),
    ogType: 'website',
    noindex: true,
  };

  const body = `    <h1>Contenido no encontrado</h1>
    <p>La página o joya que buscas no está disponible.</p>
    <p><a href="${escapeHtml(frontendUrl('/catalogo'))}">Ir al catálogo</a></p>`;

  return renderHtmlPage(meta, body);
};
