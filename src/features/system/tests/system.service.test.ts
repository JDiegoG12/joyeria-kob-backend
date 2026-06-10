import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import {
  getGoldPriceSetting,
  upsertGoldPriceSetting,
  getGoldPriceHistoryService,
} from '../services/system.service';

// Mockea el cliente de Prisma para aislar el servicio del sistema (precio del oro).
jest.mock('../../../config/prisma', () => ({
  prisma: {
    systemSetting: { findUnique: jest.fn() },
    goldPriceHistory: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const mockedSetting = prisma.systemSetting as jest.Mocked<
  typeof prisma.systemSetting
>;
const mockedHistory = prisma.goldPriceHistory as jest.Mocked<
  typeof prisma.goldPriceHistory
>;
const mockedTransaction = prisma.$transaction as jest.Mock;

describe('System Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGoldPriceSetting', () => {
    // Consulta la configuración con el id fijo 1.
    it('busca la configuración con id 1', async () => {
      mockedSetting.findUnique.mockResolvedValue(null);

      await getGoldPriceSetting();

      expect(mockedSetting.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('upsertGoldPriceSetting', () => {
    // Actualiza la configuración y registra el cambio en el historial, todo
    // dentro de una transacción.
    it('hace upsert de la configuración y agrega un registro al historial', async () => {
      const price = new Prisma.Decimal(360000);
      const tx = {
        systemSetting: {
          upsert: jest.fn().mockResolvedValue({ id: 1, goldPricePerGram: price }),
        },
        goldPriceHistory: { create: jest.fn().mockResolvedValue({}) },
      };
      mockedTransaction.mockImplementation(async (cb) => cb(tx));

      const result = await upsertGoldPriceSetting(price);

      expect(tx.systemSetting.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: { goldPricePerGram: price },
        create: { id: 1, goldPricePerGram: price },
      });
      expect(tx.goldPriceHistory.create).toHaveBeenCalledWith({
        data: { goldPricePerGram: price },
      });
      expect(result).toEqual({ id: 1, goldPricePerGram: price });
    });
  });

  describe('getGoldPriceHistoryService', () => {
    // Devuelve el historial ordenado de más reciente a más antiguo.
    it('ordena el historial por createdAt desc', async () => {
      mockedHistory.findMany.mockResolvedValue([]);

      await getGoldPriceHistoryService();

      expect(mockedHistory.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
