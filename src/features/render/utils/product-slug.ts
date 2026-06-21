/**
 * @file product-slug.ts
 * @description Generación y parseo del slug público de producto, ESPEJO de
 * `src/features/catalog/utils/product-slug.ts` del frontend (Fase 1).
 *
 * Debe mantenerse sincronizado con el del frontend: el formato del slug es
 * `<nombre-en-slug>-<uuid>` y el id es el UUID completo al final. Aquí se usa
 * para dos cosas:
 *   1. {@link extractProductId}: extraer el UUID de `/render/producto/:slug`
 *      para buscar el producto en la BD (mismo endpoint que `GET /products/:id`).
 *   2. {@link buildProductSlug}: reconstruir el slug canónico y poder emitir el
 *      `<link rel="canonical">` y `og:url` apuntando a la URL real del frontend.
 *
 * Se duplica (en vez de importarse) porque backend y frontend son repos
 * separados. Si cambia el formato en el frontend, actualizar también este archivo.
 */

/**
 * Patrón de un UUID anclado al final de la cadena. Se usa para extraer el `id`
 * del producto ignorando la parte del nombre (que también contiene guiones).
 */
const TRAILING_UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Convierte un texto a un slug seguro para URL (minúsculas, sin tildes,
 * secuencias no alfanuméricas → guion, sin guiones en los extremos).
 */
export const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // elimina diacríticos descompuestos por NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Construye el slug de un producto: `<nombre-en-slug>-<id>`.
 * Si el nombre quedara vacío tras slugificar, devuelve solo el id.
 */
export const buildProductSlug = (product: {
  name: string;
  id: string;
}): string => {
  const base = slugify(product.name);
  return base ? `${base}-${product.id}` : product.id;
};

/**
 * Extrae el `id` (UUID) de un slug de producto.
 *
 * @param slug - Slug recibido del router, ej. `anillo-buho-oro-18k-<uuid>`.
 * @returns El UUID si el slug contiene uno al final; `null` en caso contrario.
 */
export const extractProductId = (slug: string): string | null => {
  const match = slug.match(TRAILING_UUID_RE);
  return match ? match[0] : null;
};
