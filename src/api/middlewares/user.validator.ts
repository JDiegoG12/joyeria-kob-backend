import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { AuthenticatedRequest } from './auth.middleware';

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

export const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío.'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El apellido no puede estar vacío.'),
  // `checkFalsy: true` permite que un string vacío "" sea un valor válido para limpiar el campo.
  body('phone').optional({ checkFalsy: true }).trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Debe proporcionar un email válido.')
    .custom(async (email, { req }) => {
      const authReq = req as AuthenticatedRequest;
      const user = await prisma.user.findUnique({ where: { email } });
      // Si se encuentra un usuario con ese email y NO es el usuario actual, se rechaza.
      if (user && user.id !== authReq.user?.id) {
        return Promise.reject('El email ya está en uso por otro usuario.');
      }
    }),
  body('newPassword')
    .optional()
    .isLength({ min: 6, max: 50 })
    .withMessage('La nueva contraseña debe tener entre 6 y 50 caracteres.'),
  body('currentPassword').custom((value, { req }) => {
    // `currentPassword` es obligatorio solo si se está intentando establecer una `newPassword`.
    if (req.body.newPassword && !value) {
      throw new Error(
        'La contraseña actual es requerida para establecer una nueva.',
      );
    }
    return true;
  }),
  handleValidationErrors,
];
