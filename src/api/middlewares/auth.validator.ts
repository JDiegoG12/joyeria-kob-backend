import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Recoge el resultado de las validaciones de express-validator.
 * Si existen errores, responde con un 400 y el detalle; si no, continúa
 * hacia el siguiente middleware o controlador.
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
 * Cadena de validación para el registro de usuarios.
 * Verifica nombre, apellido, email (formato y longitud), contraseña
 * (longitud mínima y máxima) y un teléfono opcional.
 */
export const registerValidator = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido.'),
  body('lastName').trim().notEmpty().withMessage('El apellido es requerido.'),
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido.')
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder los 100 caracteres.'),
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('La contraseña debe tener entre 6 y 50 caracteres.'),
  body('phone').optional().trim(),
  handleValidationErrors,
];

/**
 * Cadena de validación para el inicio de sesión.
 * Exige un email con formato válido y una contraseña no vacía.
 */
export const loginValidator = [
  body('email').isEmail().withMessage('Debe proporcionar un email válido.'),
  body('password').notEmpty().withMessage('La contraseña es requerida.'),
  handleValidationErrors,
];
