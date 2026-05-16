import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { ERROR_CODES } from '../../shared/constants/error-codes';
import { AppError } from '../../shared/constants/app-error';

/**
 * Middleware global para el manejo de errores.
 * Atrapa cualquier error que ocurra en la cadena de middlewares o controladores asíncronos.
 * Su propósito es evitar que el servidor se cuelgue por una excepción no controlada
 * y devolver siempre una respuesta JSON estandarizada.
 *
 * DEBE ser el último middleware registrado en la aplicación Express.
 */
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error('💥 UNHANDLED ERROR:', err.stack || err);

  // Si la respuesta ya fue enviada, delegamos al manejador de errores por defecto de Express.
  if (res.headersSent) {
    return next(err);
  }

  // Manejo de errores específicos (lógica del antiguo error.middleware.ts)
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: err.code,
      message: err.message,
    });
  }

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'TOO_MANY_IMAGES', // Considera añadir este código a ERROR_CODES
        message: 'No puedes subir más de 5 imágenes por joya.',
      });
    }
  }

  // Fallback para cualquier otro error inesperado
  res.status(500).json({
    success: false,
    error: ERROR_CODES.INTERNAL_ERROR,
    message: 'Ha ocurrido un error inesperado en el servidor.',
  });
};
