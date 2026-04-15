import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { ERROR_CODES } from '../../shared/constants/error-codes';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-dev';

interface JwtPayload {
  id: string;
  role: UserRole;
}

/**
 * Middleware para autenticar usuarios vía JWT.
 * Verifica el token del header `Authorization` y adjunta el payload del usuario a la petición.
 *
 * @param req El objeto Request de Express.
 * @param res El objeto Response de Express.
 * @param next La siguiente función de middleware.
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: ERROR_CODES.UNAUTHORIZED,
      message: 'No se proveyó un token o el formato es incorrecto.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error: unknown) {
    // Opcional: loguear el error para depuración en el servidor
    if (error instanceof Error) {
      console.error('Error de verificación JWT:', error.message);
    }

    return res.status(401).json({
      success: false,
      error: ERROR_CODES.UNAUTHORIZED,
      message: 'Token inválido o expirado.',
    });
  }
};
