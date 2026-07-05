/**
 * @file sitemap.service.ts
 * @description Datos para el sitemap dinámico. Reutiliza el MISMO service de
 * productos que usan las rutas /render (`getAllProductsService`) y aplica el
 * mismo criterio de visibilidad que `/render/producto`: se excluyen los
 * productos HIDDEN; los OUT_OF_STOCK sí se incluyen.
 */

import { getAllProductsService } from '../products/services/product-service';
import { buildProductSlug } from '../render/utils/product-slug';
import { frontendUrl, productImageUrl } from '../render/render.config';

/** Una URL del sitemap: la página + sus imágenes (para el sitemap de imágenes). */
export interface SitemapEntry {
  /** URL absoluta indexable (dominio del FRONTEND). */
  loc: string;
  /** URLs absolutas de imágenes asociadas (dominio del BACKEND). */
  images: string[];
}

/**
 * Páginas estáticas públicas del frontend que deben indexarse.
 * No llevan imágenes asociadas en el sitemap.
 */
const STATIC_PATHS = [
  '/',
  '/catalogo',
  '/informacion/terminos',
  '/informacion/garantia',
  '/informacion/privacidad',
  '/informacion/materiales',
];

/** Forma mínima del producto que consume el sitemap. */
type SitemapProduct = {
  id: string;
  name: string;
  status: string;
  images: unknown;
};

/** Devuelve las URLs absolutas de las imágenes (filenames string) de un producto. */
const productImages = (images: unknown): string[] => {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img): img is string => typeof img === 'string')
    .map((filename) => productImageUrl(filename));
};

/** Entradas de las páginas estáticas. */
export const getStaticEntries = (): SitemapEntry[] =>
  STATIC_PATHS.map((path) => ({ loc: frontendUrl(path), images: [] }));

/**
 * Entradas de los productos indexables (todos menos los HIDDEN), cada una con
 * la URL canónica en el frontend (`/producto/<slug>`) y sus imágenes.
 */
export const getProductEntries = async (): Promise<SitemapEntry[]> => {
  // isAdmin=true devuelve TODOS los productos (incl. HIDDEN y OUT_OF_STOCK);
  // luego se filtran los HIDDEN para igualar el criterio de /render/producto.
  const products = (await getAllProductsService(true)) as unknown as SitemapProduct[];

  return products
    .filter((product) => product.status !== 'HIDDEN')
    .map((product) => {
      const slug = buildProductSlug({ id: product.id, name: product.name });
      return {
        loc: frontendUrl(`/producto/${slug}`),
        images: productImages(product.images),
      };
    });
};

/** Todas las entradas del sitemap: estáticas + productos. */
export const getSitemapEntries = async (): Promise<SitemapEntry[]> => {
  const products = await getProductEntries();
  return [...getStaticEntries(), ...products];
};
