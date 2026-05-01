import {
  findBanner,
  upsertBanner,
  deleteBanner,
} from '../services/banner.service';
import { IBannerFacade } from '../ports/banner.ports'; // No changes here, but keeping for context
import { FacadeResult } from '../../../shared/types/facade';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import {
  BannerResponseDto,
  UpdateBannerRequestDto,
  UpsertBannerServiceDto,
} from '../dtos/update-banner.dto';
import { processAndSaveImage } from '../../../shared/utils/image.processor';
import fs from 'fs/promises';
import path from 'path';

const BANNER_UPLOAD_PATH = path.join(process.cwd(), 'public/uploads/banners');

class BannerFacade implements IBannerFacade {
  async getBanner(): Promise<FacadeResult<BannerResponseDto | null>> {
    try {
      const banner = await findBanner();
      if (!banner) {
        return {
          success: false,
          error: ERROR_CODES.NOT_FOUND,
          message: 'No hay un banner configurado.',
          statusCode: 404,
        };
      }
      return {
        success: true,
        data: banner,
        message: 'Banner obtenido correctamente.',
      };
    } catch (error) {
      console.error('Error in getBanner facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener el banner.',
        statusCode: 500,
      };
    }
  }

  async updateBanner(
    data: UpdateBannerRequestDto,
    file?: Express.Multer.File,
  ): Promise<FacadeResult<BannerResponseDto>> {
    const existingBanner = await findBanner();

    // Validación: Si se está creando (no hay banner existente), el título y la imagen son obligatorios.
    if (!existingBanner && (!data.title?.trim() || !file)) {
      return {
        success: false,
        error: ERROR_CODES.MISSING_FIELDS,
        message:
          'Para crear un banner, el título y la imagen son obligatorios.',
        statusCode: 400,
      };
    }

    // Validación: Si se está actualizando, es obligatorio proporcionar una nueva imagen.
    if (existingBanner && !file) {
      return {
        success: false,
        error: ERROR_CODES.MISSING_FIELDS,
        message:
          'Para actualizar el banner, es obligatorio proporcionar una nueva imagen.',
        statusCode: 400,
      };
    }

    try {
      let imageUrl = existingBanner?.imageUrl;

      if (file) {
        // 1. Procesar y guardar la nueva imagen en la carpeta de banners.
        const newImageName = await processAndSaveImage(file, 'banners');

        // 2. Si había una imagen antigua, eliminarla del sistema de archivos.
        if (imageUrl) {
          const oldImagePath = path.join(BANNER_UPLOAD_PATH, imageUrl);
          await fs
            .unlink(oldImagePath)
            .catch((err) =>
              console.warn(
                `[Banner Facade] No se pudo eliminar la imagen antigua ${imageUrl}:`,
                err.message,
              ),
            );
        }
        imageUrl = newImageName;
      }

      // Si no hay banner existente y no se proporcionó imagen, o si se está actualizando y la imagen se eliminó
      // sin proporcionar una nueva, imageUrl podría ser undefined. Esto debería ser capturado por validaciones.
      // Sin embargo, como salvaguarda y para asegurar el tipo para UpsertBannerServiceDto.
      const finalImageUrl = imageUrl ?? existingBanner?.imageUrl;
      if (!finalImageUrl) {
        return {
          success: false,
          error: ERROR_CODES.INTERNAL_ERROR,
          message:
            'Error interno: no se pudo determinar la imagen para el banner.',
          statusCode: 500,
        };
      }

      const upsertData: UpsertBannerServiceDto = {
        title: data.title ?? existingBanner?.title ?? '', // Usar el título existente si no se proporciona uno nuevo
        subtitle: data.subtitle ?? existingBanner?.subtitle ?? null, // Usar el subtítulo existente si no se proporciona uno nuevo
        imageUrl: finalImageUrl,
      };

      const updatedBanner = await upsertBanner(upsertData);
      return {
        success: true,
        // Devolvemos el DTO para ser consistentes con el GET y no exponer campos internos como createdAt
        data: {
          id: updatedBanner.id,
          title: updatedBanner.title,
          subtitle: updatedBanner.subtitle,
          imageUrl: updatedBanner.imageUrl,
          updatedAt: updatedBanner.updatedAt,
        },
        message: 'Banner actualizado correctamente.',
      };
    } catch (error) {
      console.error('Error in updateBanner facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al actualizar el banner.',
        statusCode: 500,
      };
    }
  }

  async deleteBanner(): Promise<FacadeResult<null>> {
    try {
      const existingBanner = await findBanner();

      // Si no existe un banner, no hay nada que eliminar.
      if (!existingBanner) {
        return {
          success: false,
          error: ERROR_CODES.NOT_FOUND,
          message: 'No se encontró un banner para eliminar.',
          statusCode: 404,
        };
      }

      // Si el banner que se va a eliminar tiene una imagen, también la eliminamos.
      if (existingBanner?.imageUrl) {
        const imagePath = path.join(
          BANNER_UPLOAD_PATH,
          existingBanner.imageUrl,
        );
        await fs
          .unlink(imagePath)
          .catch((err) =>
            console.warn(
              `[Banner Facade] No se pudo eliminar la imagen al borrar el banner:`,
              err.message,
            ),
          );
      }

      const deleteResult = await deleteBanner();

      if (deleteResult.count === 0) {
        return {
          success: false,
          error: ERROR_CODES.NOT_FOUND,
          message: 'El banner no se encontró o ya fue eliminado.',
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: null,
        message: 'Banner eliminado correctamente.',
      };
    } catch (error) {
      console.error('Error in deleteBanner facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al eliminar el banner.',
        statusCode: 500,
      };
    }
  }
}

export const bannerFacade = new BannerFacade();
