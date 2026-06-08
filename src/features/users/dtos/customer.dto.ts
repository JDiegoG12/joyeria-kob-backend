import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { ClientWithFavoritesCount } from '../services/customer.service';

/**
 * DTO público de un cliente para los listados del panel administrativo.
 * Aplana el `_count.favorites` de Prisma en `favoritesCount` y nunca expone
 * la contraseña ni otros campos sensibles.
 */
export class CustomerListItemDTO {
  id: string;
  name: string;
  lastName: string;
  phone: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;
  /** Cantidad de productos que el cliente tiene en favoritos. */
  favoritesCount: number;

  constructor(client: ClientWithFavoritesCount) {
    this.id = client.id;
    this.name = client.name;
    this.lastName = client.lastName;
    this.phone = client.phone ?? null;
    this.email = client.email;
    this.role = client.role;
    this.createdAt = client.createdAt;
    this.favoritesCount = client._count.favorites;
  }
}

/**
 * Esquema de validación del query string del listado de clientes.
 * Todos los parámetros son opcionales; el facade aplica los valores por defecto
 * y las cotas (`page >= 1`, `limit` entre 1 y 50).
 */
export const GetCustomersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  search: z.string().trim().optional(),
});

export type GetCustomersQueryDto = z.infer<typeof GetCustomersQuerySchema>;
