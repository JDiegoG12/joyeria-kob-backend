/**
 * Códigos de error personalizados para la aplicación.
 * Usados en facades y middlewares para consistencia.
 */
export const ERROR_CODES = {
  // Errores generales
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_ID: 'INVALID_ID',
  MISSING_FIELDS: 'MISSING_FIELDS',

  // Errores de categorías
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  SLUG_ALREADY_EXISTS: 'SLUG_ALREADY_EXISTS',
  INVALID_PARENT_ID: 'INVALID_PARENT_ID',
  CATEGORY_HAS_CHILDREN: 'CATEGORY_HAS_CHILDREN',
  CATEGORY_HAS_PRODUCTS: 'CATEGORY_HAS_PRODUCTS',
  CYCLIC_REFERENCE: 'CYCLIC_REFERENCE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
