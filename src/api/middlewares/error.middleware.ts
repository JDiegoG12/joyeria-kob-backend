import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  void next; // Para evitar el error de variable no utilizada
  // Capturar errores específicos de Multer (como exceder el límite de archivos)
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'TOO_MANY_IMAGES',
        message: 'No puedes subir más de 4 imágenes por joya.',
      });
    }
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Error inesperado.',
  });
};
