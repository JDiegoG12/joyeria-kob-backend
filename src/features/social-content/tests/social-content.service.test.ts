import { prisma } from '../../../config/prisma';
import {
  findAllSocialContents,
  findSocialContentById,
  countSocialContents,
  createSocialContent,
  updateSocialContent,
  deleteSocialContent,
} from '../services/social-content.service';

// Mockea el cliente de Prisma para aislar el servicio de contenido social.
jest.mock('../../../config/prisma', () => ({
  prisma: {
    socialContent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mocked = prisma.socialContent as jest.Mocked<typeof prisma.socialContent>;

describe('Social Content Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Lista los contenidos ordenados por fecha de creación descendente.
  it('findAllSocialContents ordena por createdAt desc', async () => {
    mocked.findMany.mockResolvedValue([]);

    await findAllSocialContents();

    expect(mocked.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });

  // Busca un contenido por su ID.
  it('findSocialContentById consulta por id', async () => {
    mocked.findUnique.mockResolvedValue({ id: 1 } as never);

    const result = await findSocialContentById(1);

    expect(mocked.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual({ id: 1 });
  });

  // Cuenta el total de contenidos (usado para el límite de 10).
  it('countSocialContents devuelve el total', async () => {
    mocked.count.mockResolvedValue(4);

    const result = await countSocialContents();

    expect(result).toBe(4);
  });

  // Crea un contenido con los datos provistos.
  it('createSocialContent persiste los datos', async () => {
    const data = {
      title: 'T',
      link: 'https://x.com',
      socialNetwork: 'INSTAGRAM' as never,
      imageUrl: 'img.webp',
    };
    mocked.create.mockResolvedValue({ id: 1, ...data } as never);

    await createSocialContent(data);

    expect(mocked.create).toHaveBeenCalledWith({ data });
  });

  // Actualiza un contenido por su ID.
  it('updateSocialContent actualiza por id', async () => {
    const data = { title: 'Nuevo' };
    mocked.update.mockResolvedValue({ id: 1, ...data } as never);

    await updateSocialContent(1, data);

    expect(mocked.update).toHaveBeenCalledWith({ where: { id: 1 }, data });
  });

  // Elimina un contenido por su ID.
  it('deleteSocialContent elimina por id', async () => {
    mocked.delete.mockResolvedValue({ id: 1 } as never);

    await deleteSocialContent(1);

    expect(mocked.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
