/**
 * @file render.service.ts
 * @description Capa de datos del dynamic rendering. Reutiliza los servicios de
 * Prisma ya existentes (productos, categorías, destacados) y los transforma a
 * "view-models" con primitivos planos (sin `Decimal` ni relaciones anidadas),
 * para que la capa de vista (render.view.ts) solo se ocupe del HTML.
 *
 * Importante: se usan exactamente las mismas funciones que alimentan los
 * endpoints de `/api/products`, por lo que el contenido (precios con descuento,
 * filtrado de productos no disponibles, etc.) es idéntico al del sitio real.
 */

import {
  getAllProductsService,
  getProductByIdService,
} from '../products/services/product-service';
import { getAllCategories } from '../categories/services/category.service';
import { getFeaturedProductsService } from '../featured-products/services/featured-product.service';
import { buildProductSlug, extractProductId } from './utils/product-slug';
import { productImageUrl } from './render.config';

/** Tarjeta de producto para los listados (home/catálogo). */
export interface RenderProductCard {
  id: string;
  name: string;
  /** Slug canónico `<nombre>-<uuid>`. */
  slug: string;
  /** Ruta pública en el frontend: `/producto/<slug>`. */
  path: string;
  /** Precio con descuento aplicado (lo que paga el cliente). */
  finalPrice: number;
  /** Precio base calculado (antes de descuento). */
  calculatedPrice: number;
  /** `true` si hay un descuento activo (finalPrice < calculatedPrice). */
  hasDiscount: boolean;
  /** Nombre legible de la categoría (con su padre si es subcategoría). */
  categoryName: string | null;
  /** URL absoluta de la primera imagen, servida por este backend. */
  imageUrl: string | null;
}

/** Detalle completo de un producto para `/render/producto/:slug`. */
export interface RenderProductDetail extends RenderProductCard {
  description: string;
  /** `true` si el producto está disponible (status AVAILABLE) → JSON-LD InStock. */
  inStock: boolean;
  /** URLs absolutas de TODAS las imágenes del producto (para JSON-LD `image`). */
  imageUrls: string[];
}

/** Categoría raíz simplificada para enlazar desde la home. */
export interface RenderCategory {
  id: number;
  name: string;
}

/** Datos para `/render/home`. */
export interface RenderHomeData {
  featured: RenderProductCard[];
  categories: RenderCategory[];
}

/**
 * Forma mínima de un producto tal como lo devuelven los servicios de producto,
 * ya enriquecido con precios. Solo se tipan los campos que consume la vista.
 */
type PricedProduct = {
  id: string;
  name: string;
  description: string;
  images: unknown;
  status: string;
  calculatedPrice: number;
  finalPrice: number;
  category?: {
    name: string;
    parent?: { name: string } | null;
  } | null;
};

/** Devuelve las URLs absolutas de todas las imágenes (filenames string). */
const allImageUrls = (images: unknown): string[] => {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img): img is string => typeof img === 'string')
    .map((filename) => productImageUrl(filename));
};

/** Devuelve el nombre del primer archivo de imagen, o `null` si no hay. */
const firstImageFilename = (images: unknown): string | null => {
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    return typeof first === 'string' ? first : null;
  }
  return null;
};

/** Construye el nombre de categoría legible (`Padre › Hijo` o `Categoría`). */
const buildCategoryName = (product: PricedProduct): string | null => {
  const category = product.category;
  if (!category) return null;
  return category.parent
    ? `${category.parent.name} › ${category.name}`
    : category.name;
};

/** Mapea un producto con precio a la tarjeta usada en los listados. */
const toCard = (product: PricedProduct): RenderProductCard => {
  const slug = buildProductSlug({ id: product.id, name: product.name });
  const filename = firstImageFilename(product.images);
  return {
    id: product.id,
    name: product.name,
    slug,
    path: `/producto/${slug}`,
    finalPrice: product.finalPrice,
    calculatedPrice: product.calculatedPrice,
    hasDiscount: product.finalPrice < product.calculatedPrice,
    categoryName: buildCategoryName(product),
    imageUrl: filename ? productImageUrl(filename) : null,
  };
};

/**
 * Datos de la home: productos destacados y categorías raíz para enlazar.
 * Si no hay destacados, cae a un arreglo vacío (la home se renderiza igual).
 */
export const getRenderHomeData = async (): Promise<RenderHomeData> => {
  const [featured, categories] = await Promise.all([
    getFeaturedProductsService(),
    getAllCategories(),
  ]);

  return {
    featured: featured.map((item) => toCard(item.product as PricedProduct)),
    categories: categories
      .filter((category) => category.parentId === null)
      .map((category) => ({ id: category.id, name: category.name })),
  };
};

/**
 * Datos del catálogo: todos los productos disponibles (status AVAILABLE), con
 * el mismo filtrado público que `GET /api/products`. Sin paginar: para un
 * crawler interesa descubrir el máximo de enlaces de producto.
 */
export const getRenderCatalogData = async (): Promise<RenderProductCard[]> => {
  const products = await getAllProductsService(false);
  return products.map((product) => toCard(product as unknown as PricedProduct));
};

/**
 * Detalle de un producto a partir del slug `<nombre>-<uuid>`.
 *
 * @returns El detalle, o `null` si el slug no contiene un UUID válido, el
 *   producto no existe o no está disponible públicamente (oculto).
 */
export const getRenderProductData = async (
  slug: string,
): Promise<RenderProductDetail | null> => {
  const id = extractProductId(slug);
  if (!id) return null;

  const product = await getProductByIdService(id);
  // Se renderiza el detalle de productos existentes salvo los ocultos (HIDDEN),
  // que no deben exponerse a los crawlers. Los agotados (OUT_OF_STOCK) SÍ se
  // renderizan, igual que en el frontend (su página sigue siendo navegable).
  if (!product || product.status === 'HIDDEN') return null;

  const priced = product as unknown as PricedProduct;
  const card = toCard(priced);
  return {
    ...card,
    description: product.description,
    inStock: product.status === 'AVAILABLE',
    imageUrls: allImageUrls(priced.images),
  };
};
