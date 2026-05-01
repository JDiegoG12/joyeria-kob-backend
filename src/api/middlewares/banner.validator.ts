import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para manejar los errores de validación de express-validator.
 */
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Errores de validación en los datos de entrada.',
      details: errors.array(),
    });
  }
  next();
};

/**
 * Cadena de validadores para la actualización del banner.
 */
export const updateBannerValidator = [
  // El título, si se proporciona, no puede ser una cadena vacía.
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El título no puede ser un texto vacío.'),

  // El subtítulo es opcional y puede ser una cadena vacía para limpiarlo.
  body('subtitle').optional({ checkFalsy: true }).trim(),

  handleValidationErrors,
];
