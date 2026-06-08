import { CustomerListItemDTO } from '../dtos/customer.dto';

/**
 * Metadatos de paginación devueltos en los listados de clientes.
 * Misma forma que la paginación del catálogo de productos para mantener
 * consistencia en el frontend.
 */
export type CustomersPagination = {
  /** Total de clientes que coinciden con el filtro. */
  total: number;
  /** Página actual (1-indexada). */
  page: number;
  /** Registros por página. */
  limit: number;
  /** Total de páginas disponibles. */
  totalPages: number;
  /** Indica si existe una página siguiente. */
  hasNextPage: boolean;
  /** Indica si existe una página anterior. */
  hasPrevPage: boolean;
};

/**
 * Resultado del listado paginado de clientes.
 */
export type CustomersListResult = {
  customers: CustomerListItemDTO[];
  pagination: CustomersPagination;
};
