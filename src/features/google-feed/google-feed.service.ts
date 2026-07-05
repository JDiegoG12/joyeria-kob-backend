/**
 * @file google-feed.service.ts
 * @description Datos para el feed de productos de Google (Merchant Center).
 *
 * Sigue el MISMO patrón que `sitemap.service.ts`: reutiliza el service de
 * productos ya existente y las utilidades de slug/URL de `/render`, de modo que
 * los enlaces, imágenes y precios son idénticos a los del sitio real y al
 * JSON-LD pre-renderizado.
 *
 * ## Criterio de visibilidad
 * Se incluyen SOLO los productos visibles públicamente (status `AVAILABLE`),
 * que son exactamente los que devuelve `getAllProductsService(false)` (filtra
 * `status: 'AVAILABLE'` en la propia query SQL) y los que muestra el catálogo
 * público. Por eso:
 *   - Los `HIDDEN` y `OUT_OF_STOCK` NO entran (su página no es navegable → su
 *     `link` daría 404 y Google rechazaría el item).
 *   - Todos los items van siempre `in_stock`; no hace falta lógica de agotados.
 * Es un subconjunto estricto del sitemap (que sí lista los `OUT_OF_STOCK`).
 *
 * ## Precio (coherencia con el JSON-LD para evitar "price mismatch")
 * El JSON-LD del detalle (front `structured-data.ts` y render `render.view.ts`)
 * emite `offers.price = Math.round(finalPrice)`. La landing real, además, muestra
 * el precio de lista tachado cuando hay descuento. Por eso:
 *   - Sin descuento: `g:price = finalPrice`.
 *   - Con descuento: `g:price = calculatedPrice` (lista) y `g:sale_price =
 *     finalPrice` (oferta). El precio efectivo del feed (`sale_price`) sigue
 *     siendo `finalPrice`, idéntico al `offers.price` del JSON-LD.
 * La condición de descuento es la MISMA que usa la landing
 * (`product-detail-content.tsx`): `discountValue > 0 && finalPrice > 0 &&
 * finalPrice < calculatedPrice`.
 */

import { getAllProductsService } from '../products/services/product-service';
import { buildProductSlug } from '../render/utils/product-slug';
import { frontendUrl, productImageUrl, SITE_NAME } from '../render/render.config';

/**
 * ID de la taxonomía de Google para joyería genérica:
 * `Apparel & Accessories > Jewelry`. Es el fallback cuando la categoría del
 * producto no tiene un subtipo más específico mapeado.
 */
const GOOGLE_PRODUCT_CATEGORY_JEWELRY = 188;

/**
 * Mapa de `category.slug` → ID de la Google Product Taxonomy (subtipos de
 * `Apparel & Accessories > Jewelry`). IDs estándar y estables de la taxonomía.
 * Cualquier slug no listado cae al genérico {@link GOOGLE_PRODUCT_CATEGORY_JEWELRY}.
 */
const GOOGLE_PRODUCT_CATEGORY_BY_SLUG: Record<string, number> = {
  anillos: 200, // Jewelry > Rings
  aretes: 191, // Jewelry > Earrings
  dijes: 189, // Jewelry > Charms & Pendants
  cadenas: 196, // Jewelry > Necklaces
  pulseras: 190, // Jewelry > Bracelets
  herrajes: GOOGLE_PRODUCT_CATEGORY_JEWELRY, // sin subtipo propio → genérico
};

/** Largo máximo recomendado por Google para `g:description`. */
const MAX_DESCRIPTION = 5000;

/** Categoría tal como la entrega el service de productos (con padre opcional). */
type FeedCategory = {
  name: string;
  slug: string;
  parent?: { name: string; slug: string } | null;
} | null;

/**
 * Forma mínima de un producto ya enriquecido con precios, tal como lo devuelve
 * `getAllProductsService`. Solo se tipan los campos que consume el feed.
 */
type PricedProduct = {
  id: string;
  name: string;
  description: string;
  images: unknown;
  status: string;
  discountValue: number;
  calculatedPrice: number;
  finalPrice: number;
  category?: FeedCategory;
};

/** Un item del feed con primitivos planos, listo para serializar a XML. */
export interface GoogleFeedItem {
  /** `g:id` — UUID del producto. */
  id: string;
  /** `g:title` — nombre del producto. */
  title: string;
  /** `g:description` — descripción limpia (sin HTML, recortada). */
  description: string;
  /** `g:link` — URL canónica del producto en el FRONTEND. */
  link: string;
  /** `g:image_link` — URL absoluta de la primera imagen (servida por el backend). */
  imageLink: string;
  /** `g:additional_image_link` — URLs absolutas de las imágenes restantes. */
  additionalImageLinks: string[];
  /** `g:availability` — siempre `in_stock` (solo entran productos AVAILABLE). */
  availability: 'in_stock';
  /** `g:price` — precio de lista con descuento, o final sin él (`"<entero> COP"`). */
  price: string;
  /** `g:sale_price` — solo presente si hay descuento (`"<entero> COP"`). */
  salePrice?: string;
  /** `g:brand` — marca fija. */
  brand: string;
  /** `g:condition` — siempre `new`. */
  condition: 'new';
  /** `g:identifier_exists` — `no` (la joyería no maneja GTIN/MPN). */
  identifierExists: 'no';
  /** `g:google_product_category` — ID de la taxonomía de Google. */
  googleProductCategory: number;
  /** `g:product_type` — nombre de la categoría del producto, o `null`. */
  productType: string | null;
}

/** Quita etiquetas HTML, colapsa espacios y recorta a {@link MAX_DESCRIPTION}. */
const cleanDescription = (text: string): string => {
  const clean = (text ?? '')
    .replace(/<[^>]*>/g, ' ') // elimina cualquier etiqueta HTML
    .replace(/\s+/g, ' ') // colapsa espacios/saltos de línea
    .trim();
  return clean.length > MAX_DESCRIPTION ? clean.slice(0, MAX_DESCRIPTION) : clean;
};

/** Devuelve los nombres de archivo de imagen (strings) de un producto. */
const imageFilenames = (images: unknown): string[] => {
  if (!Array.isArray(images)) return [];
  return images.filter((img): img is string => typeof img === 'string');
};

/**
 * Resuelve el ID de la taxonomía de Google para la categoría de un producto.
 * Intenta primero el slug de la categoría, luego el del padre (si es
 * subcategoría) y, si nada coincide, devuelve el genérico de joyería.
 */
const resolveGoogleCategory = (category: FeedCategory): number => {
  if (!category) return GOOGLE_PRODUCT_CATEGORY_JEWELRY;
  const bySlug = GOOGLE_PRODUCT_CATEGORY_BY_SLUG[category.slug];
  if (bySlug !== undefined) return bySlug;
  if (category.parent) {
    const byParent = GOOGLE_PRODUCT_CATEGORY_BY_SLUG[category.parent.slug];
    if (byParent !== undefined) return byParent;
  }
  return GOOGLE_PRODUCT_CATEGORY_JEWELRY;
};

/**
 * Formatea un precio al formato que espera Google: entero sin separadores de
 * miles ni decimales, seguido de la moneda. Se redondea igual que el JSON-LD.
 *
 * @example formatPrice(1825000) // "1825000 COP"
 */
const formatPrice = (value: number): string => `${Math.round(value)} COP`;

/**
 * Construye los items del feed a partir de los productos públicos (AVAILABLE).
 *
 * Se omiten los productos sin ninguna imagen, porque `g:image_link` es
 * obligatorio para Google y un item sin imagen sería rechazado.
 *
 * @returns Lista de items lista para serializar a RSS 2.0.
 */
export const getGoogleFeedItems = async (): Promise<GoogleFeedItem[]> => {
  // isAdmin=false → el service filtra `status: 'AVAILABLE'` en SQL, igual que el
  // catálogo público. Cada producto llega con calculatedPrice/discountValue/finalPrice.
  const products = (await getAllProductsService(
    false,
  )) as unknown as PricedProduct[];

  return products
    .map((product): GoogleFeedItem | null => {
      const filenames = imageFilenames(product.images);
      if (filenames.length === 0) return null; // g:image_link es obligatorio

      const slug = buildProductSlug({ id: product.id, name: product.name });

      // Mismo criterio de descuento visible que la landing real
      // (product-detail-content.tsx): solo si reduce el precio sin anularlo.
      const hasDiscount =
        product.discountValue > 0 &&
        product.finalPrice > 0 &&
        product.finalPrice < product.calculatedPrice;

      return {
        id: product.id,
        title: product.name,
        description: cleanDescription(product.description),
        link: frontendUrl(`/producto/${slug}`),
        imageLink: productImageUrl(filenames[0]),
        additionalImageLinks: filenames.slice(1).map(productImageUrl),
        availability: 'in_stock',
        // Con descuento: g:price = lista (calculatedPrice), g:sale_price = oferta
        // (finalPrice). Sin descuento: g:price = finalPrice. El precio efectivo
        // (sale_price o price) siempre es finalPrice = offers.price del JSON-LD.
        price: hasDiscount
          ? formatPrice(product.calculatedPrice)
          : formatPrice(product.finalPrice),
        salePrice: hasDiscount ? formatPrice(product.finalPrice) : undefined,
        brand: SITE_NAME,
        condition: 'new',
        identifierExists: 'no',
        googleProductCategory: resolveGoogleCategory(product.category ?? null),
        productType: product.category?.name ?? null,
      };
    })
    .filter((item): item is GoogleFeedItem => item !== null);
};
