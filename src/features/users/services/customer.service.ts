import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { getUserFavoritesService } from '../../favorites/services/favorite.service';
import { FavoriteWithProduct } from '../../favorites/ports/favorite.ports';

/**
 * Selección de campos públicos de un cliente para los listados del panel
 * administrativo. Excluye deliberadamente `password` y agrega el conteo de
 * favoritos (`_count.favorites`) para mostrarlo en la tabla sin traer toda la
 * relación.
 */
const clientSelect = {
  id: true,
  name: true,
  lastName: true,
  phone: true,
  email: true,
  role: true,
  createdAt: true,
  _count: { select: { favorites: true } },
} satisfies Prisma.UserSelect;

/**
 * Cliente tal como lo devuelve Prisma con la selección `clientSelect`.
 */
export type ClientWithFavoritesCount = Prisma.UserGetPayload<{
  select: typeof clientSelect;
}>;

/**
 * Construye el filtro `where` para las consultas de clientes.
 *
 * Siempre restringe a usuarios con rol `CLIENT` (los administradores nunca
 * aparecen en el módulo de Clientes). Si se recibe un término de búsqueda,
 * filtra por coincidencia parcial en nombre, apellido, correo o teléfono.
 *
 * Nota: el conector de MySQL no soporta `mode: 'insensitive'`; la
 * insensibilidad a mayúsculas/minúsculas la aporta la collation de la columna.
 *
 * @param search - Término de búsqueda opcional (ya sin `undefined` vacío).
 */
const buildClientWhere = (search?: string): Prisma.UserWhereInput => {
  const where: Prisma.UserWhereInput = { role: UserRole.CLIENT };

  const term = search?.trim();
  if (term) {
    where.OR = [
      { name: { contains: term } },
      { lastName: { contains: term } },
      { email: { contains: term } },
      { phone: { contains: term } },
    ];
  }

  return where;
};

/**
 * Obtiene una página de clientes ordenados por fecha de registro (más recientes
 * primero).
 *
 * @param params.page - Número de página (1-indexado, ya validado).
 * @param params.limit - Cantidad de registros por página (ya validado/acotado).
 * @param params.search - Término de búsqueda opcional.
 * @returns Lista de clientes de la página solicitada.
 */
export const findClientsPaginated = async ({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search?: string;
}): Promise<ClientWithFavoritesCount[]> => {
  return prisma.user.findMany({
    where: buildClientWhere(search),
    select: clientSelect,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Cuenta el total de clientes que coinciden con el filtro de búsqueda.
 * Se usa para calcular el total de páginas de la paginación.
 *
 * @param search - Término de búsqueda opcional (mismo filtro que el listado).
 */
export const countClients = async (search?: string): Promise<number> => {
  return prisma.user.count({ where: buildClientWhere(search) });
};

/**
 * Obtiene todos los favoritos de un cliente para la vista del administrador.
 *
 * Reutiliza el servicio de favoritos de la tienda pero con `onlyAvailable:false`
 * para incluir también productos ocultos/no disponibles (el admin debe ver el
 * historial completo de intereses del cliente).
 *
 * @param userId - ID del cliente.
 */
export const findClientFavorites = async (
  userId: string,
): Promise<FavoriteWithProduct[]> => {
  return getUserFavoritesService(userId, { onlyAvailable: false });
};
