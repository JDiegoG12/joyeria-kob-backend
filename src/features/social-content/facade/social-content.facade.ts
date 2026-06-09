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

class SocialContentFacade implements ISocialContentFacade {
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
