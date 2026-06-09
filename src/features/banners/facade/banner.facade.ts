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
import path from 'path'; // path sigue siendo útil para path.join
import { getUploadsSubfolderPath } from '../../../config/paths.config';

/**
 * Fachada para la gestión del banner principal.
 *
 * Responsabilidades:
 * - Orquestar la obtención, creación, actualización y eliminación del banner.
 * - Gestionar el procesamiento y almacenamiento de imágenes.
 * - Manejar la eliminación de imágenes antiguas al actualizar.
 * - Validar que siempre exista al menos una imagen configurada.
 *
 * Cambios realizados (ACTUALIZACIÓN):
 * -  La imagen ahora es OPCIONAL en updateBanner.
 * -  Permite actualizar solo el texto sin subir nueva imagen.
 * -  Si no se proporciona archivo, conserva la imagen existente.
 * -  Solo procesa y guarda nueva imagen si se sube un archivo.
 */
class BannerFacade implements IBannerFacade {
  /**
   * Obtiene el banner principal configurado.
   *
   * @returns El banner actual con su imagen, título y subtítulo.
   * @returns 404 si no existe ningún banner configurado.
   */
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
        data: {
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle,
          imageUrl: `/uploads/banners/${banner.imageUrl}`,
          updatedAt: banner.updatedAt,
        },
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

  /**
   * Crea o actualiza el banner principal (operación upsert).
   *
   * CAMBIOS IMPORTANTES:
   * - La imagen es ahora OPCIONAL.
   * - Si no se proporciona `file`, se conserva la imagen existente.
   * - Permite actualizar solo el texto sin necesidad de subir imagen.
   * - Si se proporciona una nueva imagen, reemplaza a la anterior.
   *
   * @param data - Datos del banner (title, subtitle). Ambos son opcionales.
   * @param file - Archivo de imagen opcional. Si es undefined, se mantiene la imagen actual.
   * @returns El banner actualizado con la nueva configuración.
   * @returns 500 si no se puede determinar una imagen (ni nueva ni existente).
   *
   * @example
   * // Actualizar solo texto (sin cambiar imagen):
   * await updateBanner({ title: 'Nuevo título', subtitle: 'Nuevo subtítulo' }, undefined)
   *
   * @example
   * // Actualizar texto e imagen:
   * await updateBanner({ title: 'Nuevo título' }, file)
   *
   * @example
   * // Actualizar solo imagen (sin cambiar texto):
   * await updateBanner({}, file)
   */
  async updateBanner(
    data: UpdateBannerRequestDto,
    file?: Express.Multer.File,
  ): Promise<FacadeResult<BannerResponseDto>> {
    // VALIDACIÓN CORREGIDA: La imagen ya NO es obligatoria
    // Se eliminó el bloqueo: if (!file) { return error 400 }
    // Ahora permitimos que file sea undefined para actualizar solo texto.

    const existingBanner = await findBanner();

    try {
      // Inicializamos con la imagen existente (si hay una)
      let imageUrl = existingBanner?.imageUrl;

      // Solo procesamos nueva imagen si se subió un archivo
      if (file) {
        // 1. Procesar y guardar la nueva imagen en la carpeta de banners
        const newImageName = await processAndSaveImage(file, 'banners');

        // 2. Eliminar la imagen anterior si existe (para no acumular archivos)
        if (imageUrl) {
          const oldImagePath = path.join(
            getUploadsSubfolderPath('banners'),
            imageUrl,
          );
          await fs
            .unlink(oldImagePath)
            .catch((err) =>
              console.warn(
                `[Banner Facade] No se pudo eliminar la imagen antigua ${imageUrl}:`,
                err.message,
              ),
            );
        }

        // Actualizamos imageUrl con el nombre del nuevo archivo
        imageUrl = newImageName;
      }

      // VALIDACIÓN DE SEGURIDAD:
      // Aseguramos que tengamos una imagen (nueva o existente)
      // Esto previene guardar un banner sin imagen
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

      // Preparamos los datos para el servicio de upsert
      // Usamos los valores proporcionados o los existentes como fallback
      const upsertData: UpsertBannerServiceDto = {
        title: data.title ?? existingBanner?.title ?? '',
        subtitle: data.subtitle ?? existingBanner?.subtitle ?? null,
        imageUrl: finalImageUrl,
      };

      // Ejecutamos la actualización/creación en la base de datos
      const updatedBanner = await upsertBanner(upsertData);
      return {
        success: true,
        data: {
          id: updatedBanner.id,
          title: updatedBanner.title,
          subtitle: updatedBanner.subtitle,
          imageUrl: `/uploads/banners/${updatedBanner.imageUrl}`,
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

  /**
   * Elimina permanentemente el banner principal y su imagen asociada.
   *
   * @returns 404 si no existe un banner para eliminar.
   * @returns Éxito con 200 si se eliminó correctamente.
   */
  async deleteBanner(): Promise<FacadeResult<null>> {
    try {
      const existingBanner = await findBanner();

      // Si no existe un banner, no hay nada que eliminar
      if (!existingBanner) {
        return {
          success: false,
          error: ERROR_CODES.NOT_FOUND,
          message: 'No se encontró un banner para eliminar.',
          statusCode: 404,
        };
      }

      // Si el banner tiene una imagen, la eliminamos del sistema de archivos
      if (existingBanner?.imageUrl) {
        const imagePath = path.join(
          getUploadsSubfolderPath('banners'),
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

      // Eliminamos el registro de la base de datos
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
