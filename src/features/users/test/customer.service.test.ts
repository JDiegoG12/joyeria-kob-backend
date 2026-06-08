import { prisma } from '../../../config/prisma';
import { UserRole } from '@prisma/client';
import {
  countClients,
  findClientFavorites,
  findClientsPaginated,
} from '../services/customer.service';
import { getUserFavoritesService } from '../../favorites/services/favorite.service';

// Mock del cliente de Prisma para aislar las pruebas de la base de datos real.
jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock del servicio de favoritos para verificar la delegación sin tocar la BD.
jest.mock('../../favorites/services/favorite.service', () => ({
  getUserFavoritesService: jest.fn(),
}));

const mockedPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;
const mockedGetUserFavorites = getUserFavoritesService as jest.Mock;

describe('Customer Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findClientsPaginated', () => {
    it('debe consultar solo clientes (rol CLIENT) con la paginación correcta', async () => {
      mockedPrismaUser.findMany.mockResolvedValue([]);

      await findClientsPaginated({ page: 2, limit: 10 });

      expect(mockedPrismaUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: UserRole.CLIENT },
          skip: 10, // (page 2 - 1) * limit 10
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('debe agregar el filtro de búsqueda (OR) cuando se envía un término', async () => {
      mockedPrismaUser.findMany.mockResolvedValue([]);

      await findClientsPaginated({ page: 1, limit: 5, search: 'juan' });

      expect(mockedPrismaUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: UserRole.CLIENT,
            OR: [
              { name: { contains: 'juan' } },
              { lastName: { contains: 'juan' } },
              { email: { contains: 'juan' } },
              { phone: { contains: 'juan' } },
            ],
          },
          skip: 0,
          take: 5,
        }),
      );
    });

    it('no debe agregar OR cuando el término es solo espacios', async () => {
      mockedPrismaUser.findMany.mockResolvedValue([]);

      await findClientsPaginated({ page: 1, limit: 5, search: '   ' });

      const callArg = mockedPrismaUser.findMany.mock.calls[0]?.[0];
      expect(callArg?.where).toEqual({ role: UserRole.CLIENT });
    });
  });

  describe('countClients', () => {
    it('debe contar solo clientes con el mismo filtro de búsqueda', async () => {
      mockedPrismaUser.count.mockResolvedValue(7);

      const total = await countClients('perez');

      expect(total).toBe(7);
      expect(mockedPrismaUser.count).toHaveBeenCalledWith({
        where: {
          role: UserRole.CLIENT,
          OR: [
            { name: { contains: 'perez' } },
            { lastName: { contains: 'perez' } },
            { email: { contains: 'perez' } },
            { phone: { contains: 'perez' } },
          ],
        },
      });
    });
  });

  describe('findClientFavorites', () => {
    it('debe delegar en el servicio de favoritos incluyendo productos no disponibles', async () => {
      mockedGetUserFavorites.mockResolvedValue([]);

      await findClientFavorites('user-123');

      expect(mockedGetUserFavorites).toHaveBeenCalledWith('user-123', {
        onlyAvailable: false,
      });
    });
  });
});
