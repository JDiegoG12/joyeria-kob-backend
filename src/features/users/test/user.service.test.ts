import { prisma } from '../../../config/prisma';
import { createUser, findUserByEmail } from '../services/user.service';
import { User, UserRole } from '@prisma/client';

// Mock del cliente de Prisma para aislar las pruebas de la base de datos real.
jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Tipado del mock para una mejor experiencia de desarrollo con Jest.
const mockedPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;

describe('User Service', () => {
  // Limpiar mocks después de cada prueba para evitar interferencias.
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Pruebas para la función `findUserByEmail`.
  describe('findUserByEmail', () => {
    it('should return a user if found by email', async () => {
      const mockUser: User = {
        id: '1',
        name: 'Test',
        lastName: 'User',
        phone: null,
        email: 'test@example.com',
        password: 'hashedpassword',
        role: UserRole.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockedPrismaUser.findUnique.mockResolvedValue(mockUser);

      const result = await findUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockedPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if user is not found by email', async () => {
      mockedPrismaUser.findUnique.mockResolvedValue(null);

      const result = await findUserByEmail('notfound@example.com');

      expect(result).toBeNull();
      expect(mockedPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'notfound@example.com' },
      });
    });
  });

  // Pruebas para la función `createUser`.
  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const userData = {
        name: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'hashedpassword',
      };
      const createdUser: User = {
        id: '2',
        name: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'hashedpassword',
        phone: null,
        role: UserRole.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockedPrismaUser.create.mockResolvedValue(createdUser);

      const result = await createUser(userData);

      expect(result).toEqual(createdUser);
      expect(mockedPrismaUser.create).toHaveBeenCalledWith({ data: userData });
    });
  });
});
