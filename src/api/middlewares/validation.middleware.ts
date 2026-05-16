import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ERROR_CODES } from '../../shared/constants/error-codes';

/**
 * Middleware para manejar los errores de validación de express-validator.
 * Debe colocarse en la cadena de middlewares después de los validadores.
 *
 * Si hay errores, responde con un 400 y un detalle de los mismos.
 * Si no hay errores, pasa al siguiente middleware (el controlador).
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: ERROR_CODES.VALIDATION_ERROR,
      message: 'Los datos proporcionados no son válidos.',
      details: errors.array(),
    });
  }
  next();
};
