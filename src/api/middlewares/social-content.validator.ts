import { body, param } from 'express-validator';
import { SocialNetwork } from '@prisma/client';

const title = body('title')
  .notEmpty()
  .withMessage('El título es requerido.')
  .isString()
  .withMessage('El título debe ser texto.')
  .isLength({ max: 100 })
  .withMessage('El título no puede exceder los 100 caracteres.');

const link = body('link')
  .notEmpty()
  .withMessage('El enlace es requerido.')
  .isURL()
  .withMessage('El enlace debe ser una URL válida.');

const socialNetwork = body('socialNetwork')
  .notEmpty()
  .withMessage('La red social es requerida.')
  .isIn(Object.values(SocialNetwork))
  .withMessage('El valor de la red social no es válido.');

export const createSocialContentValidator = [title, link, socialNetwork];

export const updateSocialContentValidator = [
  title.optional(),
  link.optional(),
  socialNetwork.optional(),
];

export const validateIdParam = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('El ID debe ser un número entero positivo.')
    .toInt(),
];
