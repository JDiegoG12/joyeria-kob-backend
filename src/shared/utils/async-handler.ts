import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Define el tipo para un controlador de Express asíncrono.
 * La promesa puede resolver a `any` porque el valor de resolución
 * no es utilizado por el `asyncHandler`. El controlador es responsable
 * de enviar una respuesta por sí mismo (ej. `res.json()`).
 * El uso de `any` proporciona flexibilidad para envolver controladores
 * que pueden o no devolver un valor explícito.
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

/**
 * Envuelve una función de controlador asíncrona para capturar cualquier error
 * que ocurra y pasarlo al siguiente middleware de manejo de errores de Express.
 * Esto evita que el servidor se cuelgue por excepciones no controladas en rutas asíncronas.
 *
 * @param fn La función de controlador asíncrona a envolver.
 * @returns Un `RequestHandler` de Express que maneja la lógica asíncrona.
 */
export const asyncHandler =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
