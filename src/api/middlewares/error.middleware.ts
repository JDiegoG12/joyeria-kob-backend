import { Request, Response } from 'express';

/**
 * Middleware global para capturar errores.
 */
export const errorHandler = (err: any, req: Request, res: Response,) => {
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        error: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Ocurrió un error inesperado'
    });
};