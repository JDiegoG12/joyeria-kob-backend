import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { AppError } from '../../shared/constants/app-error';

/**
 * Manejador de errores de Express que traduce excepciones en respuestas JSON.
 *
 * Distingue tres casos:
 * - `AppError`: usa su `status` y `code` para responder con el error de negocio.
 * - `MulterError` de tipo `LIMIT_UNEXPECTED_FILE`: responde 400 por exceso de imágenes.
 * - Cualquier otro error: lo registra y responde con un 500 genérico.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  void next; // Para evitar el error de variable no utilizada

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
        error: 'TOO_MANY_IMAGES',
        message: 'No puedes subir más de 5 imágenes por joya.',
      });
    }
  }

  // Loguear el error para depuración en caso de errores inesperados
  console.error(err);

  // Fallback para errores genéricos o inesperados
  return res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Error inesperado en el servidor.',
  });
};
