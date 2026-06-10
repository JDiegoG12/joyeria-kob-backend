import { ErrorCode } from './error-codes';

/**
 * Error de aplicación con metadatos para construir respuestas HTTP coherentes.
 *
 * Extiende el `Error` nativo añadiendo el código HTTP (`status`) y un código
 * de error de negocio (`code`). El manejador global de errores lo reconoce
 * para responder con el estado y el código adecuados.
 */
export class AppError extends Error {
  /** Código de estado HTTP asociado al error (por ejemplo, 404 o 400). */
  public status: number;
  /** Código de error de negocio definido en `ERROR_CODES`. */
  public code: ErrorCode;

  /**
   * @param message - Mensaje descriptivo del error, apto para el cliente.
   * @param status - Código de estado HTTP que debe devolverse.
   * @param code - Código de error de negocio asociado.
   */
  constructor(message: string, status: number, code: ErrorCode) {
    super(message);
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
