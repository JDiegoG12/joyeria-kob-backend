/**
 * @file json-ld.ts
 * @description Builders de datos estructurados schema.org (JSON-LD) para el HTML
 * pre-renderizado. La MISMA estructura se replica en el frontend
 * (`src/config/seo.ts` de joyeria-kob-frontend) para que ambos lados emitan
 * datos idénticos y no queden inconsistentes. Si cambia uno, actualizar el otro.
 *
 * Estos builders devuelven objetos planos; la serialización segura a
 * `<script type="application/ld+json">` la hace `renderHtmlPage` (html.util.ts).
 */

import { FRONTEND_PUBLIC_URL, SITE_NAME } from '../render.config';

/**
 * URL absoluta y ESTABLE del logo de la marca, servida desde public/ del
 * frontend (`public/LogoKOB.svg`). Debe coincidir con la del frontend.
 */
export const ORGANIZATION_LOGO_URL = `${FRONTEND_PUBLIC_URL}/LogoKOB.svg`;

/** Perfiles sociales oficiales (sameAs). Coincide con el frontend. */
export const ORGANIZATION_SAME_AS = [
  'https://www.instagram.com/joyeria_kob',
  'https://www.tiktok.com/@joyeria_kob',
];

/** JSON-LD de la organización (marca). Se incrusta en la home. */
export const buildOrganizationJsonLd = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: FRONTEND_PUBLIC_URL,
  logo: ORGANIZATION_LOGO_URL,
  sameAs: ORGANIZATION_SAME_AS,
});

/** Datos necesarios para construir el JSON-LD de un producto. */
export interface ProductJsonLdInput {
  /** Nombre del producto. */
  name: string;
  /** Descripción (texto plano). */
  description: string;
  /** URLs absolutas de las imágenes (servidas por este backend). */
  images: string[];
  /** SKU = id (UUID) del producto. */
  sku: string;
  /** Precio numérico SIN separadores de miles (ej. 4200000). */
  price: number;
  /** `true` si el producto está disponible (status AVAILABLE). */
  inStock: boolean;
  /** URL canónica del producto en el FRONTEND. */
  url: string;
}

/** JSON-LD de un producto (schema.org/Product). Se incrusta en el detalle. */
export const buildProductJsonLd = (
  input: ProductJsonLdInput,
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: input.name,
  image: input.images,
  description: input.description,
  sku: input.sku,
  brand: {
    '@type': 'Organization',
    name: SITE_NAME,
  },
  offers: {
    '@type': 'Offer',
    price: input.price,
    priceCurrency: 'COP',
    availability: input.inStock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    url: input.url,
  },
});
