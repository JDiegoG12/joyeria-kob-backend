/**
 * Representa un resultado exitoso de una operación de fachada.
 */
export type FacadeSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

/**
 * Representa un resultado fallido de una operación de fachada.
 */
export type FacadeFailure = {
  success: false;
  error: string;
  message: string;
  statusCode: number;
};

/**
 * Un tipo de resultado unificado para operaciones de fachada, que puede ser un éxito o un fracaso.
 */
export type FacadeResult<T> = FacadeSuccess<T> | FacadeFailure;
