import { UserRole } from '@prisma/client';

// Extiende la interfaz Request de Express para añadir la propiedad `user`
declare global {
  namespace Express {
    export interface Request {
      user?: { id: string; role: UserRole };
    }
  }
}

export {};
