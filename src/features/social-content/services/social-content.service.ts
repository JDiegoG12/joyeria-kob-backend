import { prisma } from '../../../config/prisma';
import {
  ICreateSocialContentDTO,
  IUpdateSocialContentDTO,
} from '../dtos/social-content.dto';

/**
 * Obtiene todos los contenidos sociales, ordenados por fecha de creación descendente.
 */
export const findAllSocialContents = () => {
  return prisma.socialContent.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * Busca un contenido social por su ID.
 */
export const findSocialContentById = (id: number) => {
  return prisma.socialContent.findUnique({
    where: { id },
  });
};

/**
 * Cuenta el número total de contenidos sociales.
 */
export const countSocialContents = () => {
  return prisma.socialContent.count();
};

/**
 * Crea un nuevo registro de contenido social en la base de datos.
 */
export const createSocialContent = (data: ICreateSocialContentDTO) => {
  return prisma.socialContent.create({
    data,
  });
};

/**
 * Actualiza un contenido social existente por su ID.
 */
export const updateSocialContent = (
  id: number,
  data: IUpdateSocialContentDTO,
) => {
  return prisma.socialContent.update({
    where: { id },
    data,
  });
};

/**
 * Elimina un contenido social de la base de datos por su ID.
 */
export const deleteSocialContent = (id: number) => {
  return prisma.socialContent.delete({
    where: { id },
  });
};
