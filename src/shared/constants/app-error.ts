import { ErrorCode } from './error-codes'; // ajusta la ruta

export class AppError extends Error {
  public status: number;
  public code: ErrorCode;

  constructor(message: string, status: number, code: ErrorCode) {
    super(message);
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
