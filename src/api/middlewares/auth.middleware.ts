import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { ERROR_CODES } from '../../shared/constants/error-codes';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-dev';

// Define una interfaz específica para el payload de nuestro token, extendiendo la de la librería.
export interface TokenPayload extends JwtPayload {
  id: string;
  role: UserRole;
}

// Extiende la interfaz Request de Express para incluir el payload del usuario decodificado.
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware de autenticación: verifica la validez de un token JWT.
 * Extrae el token del encabezado 'Authorization: Bearer <token>'.
 * Si el token es válido, decodifica el payload (id, role) y lo adjunta a `req.user`.
 * Si el token no existe o es inválido, responde con un error 401 o 403.
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: ERROR_CODES.UNAUTHORIZED,
      message: 'Acceso denegado. No se proporcionó un token.',
    });
  }

  jwt.verify(
    token,
    JWT_SECRET,
    (err: VerifyErrors | null, decoded?: JwtPayload | string) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: ERROR_CODES.FORBIDDEN,
          message: 'El token es inválido o ha expirado.',
        });
      }

      // Guarda de tipo para asegurar que el payload decodificado tiene la estructura que esperamos.
      if (typeof decoded === 'object' && decoded && 'id' in decoded) {
        req.user = decoded as TokenPayload;
        next();
      } else {
        return res.status(403).json({
          success: false,
          error: ERROR_CODES.FORBIDDEN,
          message: 'El formato del token es incorrecto.',
        });
      }
    },
  );
};

/**
 * Middleware de autorización: verifica si el usuario autenticado tiene un rol específico.
 * Debe usarse siempre DESPUÉS del middleware `authenticateToken`.
 * @param requiredRole El rol que se requiere para acceder a la ruta.
 */
export const authorizeRole = (requiredRole: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: ERROR_CODES.FORBIDDEN,
        message: 'No tienes los permisos necesarios para realizar esta acción.',
      });
    }
    next();
  };
};

// Exporta un middleware específico para requerir rol de administrador
export const requireAdmin = authorizeRole(UserRole.ADMIN);

// Exporta un middleware específico para requerir rol de cliente
export const requireClient = authorizeRole(UserRole.CLIENT);
