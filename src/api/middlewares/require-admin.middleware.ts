import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para autorizar a usuarios administradores.
 * Verifica si el usuario autenticado tiene el rol 'ADMIN'.
 * Este middleware debe ejecutarse *después* de `authMiddleware`.
 *
 * @param req El objeto Request de Express.
 * @param res El objeto Response de Express.
 * @param next La siguiente función de middleware.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Acceso denegado. Se requieren privilegios de administrador.',
    });
  }
  next();
};
