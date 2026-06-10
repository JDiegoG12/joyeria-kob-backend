import { prisma } from '../../../config/prisma';
import {
  findBanner,
  upsertBanner,
  deleteBanner,
} from '../services/banner.service';

// Mockea el cliente de Prisma para aislar el servicio del banner principal.
jest.mock('../../../config/prisma', () => ({
  prisma: {
    banner: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockedBanner = prisma.banner as jest.Mocked<typeof prisma.banner>;

describe('Banner Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findBanner', () => {
    // Siempre consulta el registro único con id = 1.
    it('busca el banner con id fijo 1', async () => {
      mockedBanner.findUnique.mockResolvedValue(null);

      await findBanner();

      expect(mockedBanner.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    // Devuelve el banner encontrado.
    it('devuelve el banner cuando existe', async () => {
      const banner = {
        id: 1,
        title: 'Hero',
        subtitle: null,
        imageUrl: 'img.webp',
        updatedAt: new Date(),
      };
      mockedBanner.findUnique.mockResolvedValue(banner as never);

      const result = await findBanner();

      expect(result).toEqual(banner);
    });
  });

  describe('upsertBanner', () => {
    // Crea o actualiza el banner con id fijo y los datos provistos.
    it('hace upsert del banner con id 1 y los datos provistos', async () => {
      const data = { title: 'T', subtitle: 'S', imageUrl: 'img.webp' };
      mockedBanner.upsert.mockResolvedValue({ id: 1, ...data } as never);

      await upsertBanner(data);

      expect(mockedBanner.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          update: data,
          create: { id: 1, ...data },
        }),
      );
    });
  });

  describe('deleteBanner', () => {
    // Usa deleteMany para no fallar si el registro no existe.
    it('elimina mediante deleteMany con id 1', async () => {
      mockedBanner.deleteMany.mockResolvedValue({ count: 1 } as never);

      const result = await deleteBanner();

      expect(mockedBanner.deleteMany).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ count: 1 });
    });
  });
});
