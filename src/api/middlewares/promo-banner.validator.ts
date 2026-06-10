import { body, param } from 'express-validator';
import { PromoLinkType } from '@prisma/client';

const title = body('title')
  .optional()
  .isString()
  .withMessage('El título debe ser texto.')
  .isLength({ max: 120 })
  .withMessage('El título no puede exceder los 120 caracteres.');

const subtitle = body('subtitle')
  .optional()
  .isString()
  .withMessage('El subtítulo debe ser texto.')
  .isLength({ max: 200 })
  .withMessage('El subtítulo no puede exceder los 200 caracteres.');

const linkType = body('linkType')
  .isIn(Object.values(PromoLinkType))
  .withMessage('El tipo de enlace no es válido.');

// linkProductId / linkCategoryId se validan en su forma básica aquí; la
// coherencia con `linkType` (cuál es obligatorio) se resuelve en la fachada.
const linkProductId = body('linkProductId')
  .optional({ values: 'falsy' })
  .isUUID()
  .withMessage('El producto del enlace debe ser un UUID válido.');

const linkCategoryId = body('linkCategoryId')
  .optional({ values: 'falsy' })
  .isInt({ gt: 0 })
  .withMessage('La categoría del enlace debe ser un entero positivo.');

/**
 * Validadores para crear un banner de promoción.
 * Exige un `linkType` válido y valida el formato básico de título, subtítulo
 * y los identificadores de enlace (producto/categoría).
 */
export const createPromoBannerValidator = [
  title,
  subtitle,
  linkType,
  linkProductId,
  linkCategoryId,
];

/**
 * Validadores para actualizar un banner de promoción.
 * Igual que la creación, pero con `linkType` opcional para permitir
 * actualizaciones parciales.
 */
export const updatePromoBannerValidator = [
  title,
  subtitle,
  linkType.optional(),
  linkProductId,
  linkCategoryId,
];

/**
 * Validador del parámetro de ruta `id`: debe ser un entero positivo y se
 * convierte a número.
 */
export const validateIdParam = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('El ID debe ser un número entero positivo.')
    .toInt(),
];
