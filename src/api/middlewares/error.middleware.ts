import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/constants/app-error';
import { ERROR_CODES, ErrorCode } from '../../shared/constants/error-codes';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  void _next; // ← elimina la advertencia "defined but never used"

  let status = 500;
  let code: ErrorCode = ERROR_CODES.INTERNAL_ERROR;
  let message = 'Ocurrió un error inesperado';

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  res.status(status).json({
    success: false,
    error: code,
    message,
  });
};
