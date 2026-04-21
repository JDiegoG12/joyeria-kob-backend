import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware para manejar los resultados de la validación
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

// Cadena de validación para el registro de usuarios
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

// Cadena de validación para el inicio de sesión
export const loginValidator = [
  body('email').isEmail().withMessage('Debe proporcionar un email válido.'),
  body('password').notEmpty().withMessage('La contraseña es requerida.'),
  handleValidationErrors,
];
