import { FacadeResult } from '../../../shared/types/facade';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { processAndSaveImage } from '../../../shared/utils/image.processor';
import fs from 'fs/promises';
import path from 'path';
import {
  ICreateSocialContentDTO,
  ISocialContentGetResponseDTO,
  IUpdateSocialContentDTO,
  ISocialContentUpdateResponseDTO,
} from '../dtos/social-content.dto';
import { ISocialContentFacade } from '../ports/social-content.ports';
import * as service from '../services/social-content.service';
import { SocialContent } from '@prisma/client';
import { getUploadsSubfolderPath } from '../../../config/paths.config';

/**
 * Fachada de contenido social: orquesta el servicio de contenido social y el
 * procesamiento de imágenes, y unifica las respuestas en el formato
 * `FacadeResult`. También transforma las entidades en DTOs de respuesta con la
 * URL pública de la imagen.
 */
class SocialContentFacade implements ISocialContentFacade {
  /**
   * Convierte una entidad en su DTO de respuesta para GET/CREATE: omite
   * `updatedAt` y expone la URL pública de la imagen.
   */
  private mapToGetResponseDTO(
    content: SocialContent,
  ): ISocialContentGetResponseDTO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt, ...rest } = content;
    return {
      ...rest,
      imageUrl: `/uploads/social-content/${content.imageUrl}`,
    };
  }

  /**
   * Convierte una entidad en su DTO de respuesta para UPDATE: omite `createdAt`
   * y expone la URL pública de la imagen.
   */
  private mapToUpdateResponseDTO(
    content: SocialContent,
  ): ISocialContentUpdateResponseDTO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...rest } = content;
    return {
      ...rest,
      imageUrl: `/uploads/social-content/${content.imageUrl}`,
    };
  }

  /** Obtiene todos los contenidos sociales como DTOs de respuesta. */
  async getAll(): Promise<FacadeResult<ISocialContentGetResponseDTO[]>> {
    try {
      const contents = await service.findAllSocialContents();
      return {
        success: true,
        data: contents.map(this.mapToGetResponseDTO),
        message: 'Contenidos sociales obtenidos correctamente.',
      };
    } catch (error) {
      console.error('Error in getAll SocialContent facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener los contenidos sociales.',
        statusCode: 500,
      };
    }
  }

  /** Obtiene un contenido social por su ID, o un error 404 si no existe. */
  async getById(
    id: number,
  ): Promise<FacadeResult<ISocialContentGetResponseDTO | null>> {
    try {
      const content = await service.findSocialContentById(id);
      if (!content) {
        return {
          success: false,
          error: ERROR_CODES.NOT_FOUND,
          message: 'Contenido social no encontrado.',
          statusCode: 404,
        };
      }
      return {
        success: true,
        data: this.mapToGetResponseDTO(content),
        message: 'Contenido social obtenido correctamente.',
      };
    } catch (error) {
      console.error('Error in getById SocialContent facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener el contenido social.',
        statusCode: 500,
      };
    }
  }

  /**
   * Crea un contenido social: valida el límite de 10 elementos, procesa y guarda
   * la imagen y persiste el registro.
   */
  async create(
    data: Omit<ICreateSocialContentDTO, 'imageUrl'>,
    file: Express.Multer.File,
  ): Promise<FacadeResult<ISocialContentGetResponseDTO>> {
    try {
      const currentCount = await service.countSocialContents();
      if (currentCount >= 10) {
        return {
          success: false,
          error: ERROR_CODES.MAX_ITEMS_REACHED,
          message:
            'Se ha alcanzado el límite máximo de 10 contenidos sociales.',
          statusCode: 400, // 400 Bad Request es apropiado para una regla de negocio rota.
        };
      }

      const imageName = await processAndSaveImage(file, 'social-content');
      const createdContent = await service.createSocialContent({
        ...data,
        imageUrl: imageName,
      });
      return {
        success: true,
        data: this.mapToGetResponseDTO(createdContent),
        message: 'Contenido social creado correctamente.',
      };
    } catch (error) {
      console.error('Error in create SocialContent facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al crear el contenido social.',
        statusCode: 500,
      };
    }
  }

  /**
   * Actualiza un contenido social. Si llega una nueva imagen, la procesa y
   * elimina la anterior del sistema de archivos.
   */
  async update(
    id: number,
    data: IUpdateSocialContentDTO,
    file?: Express.Multer.File,
  ): Promise<FacadeResult<ISocialContentUpdateResponseDTO>> {
    try {
      const existingContent = await service.findSocialContentById(id);
      if (!existingContent) {
        return {
          success: false,
          error: ERROR_CODES.NOT_FOUND,
          message: 'Contenido social a actualizar no encontrado.',
          statusCode: 404,
        };
      }

      let newImageUrl = existingContent.imageUrl;
      if (file) {
        newImageUrl = await processAndSaveImage(file, 'social-content');
        const oldImagePath = path.join(
          getUploadsSubfolderPath('social-content'),
          existingContent.imageUrl,
        );
        await fs
          .unlink(oldImagePath)
          .catch((err) =>
            console.warn(
              `No se pudo eliminar la imagen antigua: ${err.message}`,
            ),
          );
      }

      const updatedContent = await service.updateSocialContent(id, {
        ...data,
        imageUrl: newImageUrl,
      });

      return {
        success: true,
        data: this.mapToUpdateResponseDTO(updatedContent),
        message: 'Contenido social actualizado correctamente.',
      };
    } catch (error) {
      console.error('Error in update SocialContent facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al actualizar el contenido social.',
        statusCode: 500,
      };
    }
  }

  /**
   * Elimina un contenido social y su imagen asociada del sistema de archivos.
   */
  async delete(id: number): Promise<FacadeResult<null>> {
    try {
      const existingContent = await service.findSocialContentById(id);
      if (!existingContent) {
        return {
          success: false,
          error: ERROR_CODES.NOT_FOUND,
          message: 'Contenido social a eliminar no encontrado.',
          statusCode: 404,
        };
      }

      await service.deleteSocialContent(id);

      const imagePath = path.join(
        getUploadsSubfolderPath('social-content'),
        existingContent.imageUrl,
      );
      await fs
        .unlink(imagePath)
        .catch((err) =>
          console.warn(`No se pudo eliminar la imagen: ${err.message}`),
        );

      return {
        success: true,
        data: null,
        message: 'Contenido social eliminado correctamente.',
      };
    } catch (error) {
      console.error('Error in delete SocialContent facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al eliminar el contenido social.',
        statusCode: 500,
      };
    }
  }
}

export const socialContentFacade = new SocialContentFacade();
