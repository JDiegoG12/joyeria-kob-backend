import path from 'path';
import fs from 'fs/promises';
import { PromoBanner } from '@prisma/client';
import { FacadeResult } from '../../../shared/types/facade';
import { ERROR_CODES } from '../../../shared/constants/error-codes';
import { processAndSaveImage } from '../../../shared/utils/image.processor';
import {
  IPromoBannerResponseDTO,
  IPromoBannerCreateRaw,
  IPromoBannerUpdateRaw,
  IReorderPromoBannerItem,
  ICreatePromoBannerDTO,
  IUpdatePromoBannerDTO,
  PromoLinkType,
} from '../dtos/promo-banner.dto';
import { IPromoBannerFacade } from '../ports/promo-banner.ports';
import * as service from '../services/promo-banner.service';
import { getUploadsSubfolderPath } from '../../../config/paths.config';

/** Tope máximo de banners de promoción (igual que el contenido social). */
const MAX_PROMO_BANNERS = 10;

/**
 * Resuelve los campos de enlace según el tipo, validando que el destino exista.
 * Devuelve un error de fachada si el destino requerido falta o no existe.
 */
type LinkFieldsResult =
  | { ok: true; linkProductId: string | null; linkCategoryId: number | null }
  | { ok: false; error: FacadeResult<never> };

/**
 * Fachada de banners de promoción: orquesta el servicio, el procesamiento de
 * imágenes y la validación de los enlaces, y unifica las respuestas en el
 * formato `FacadeResult`.
 */
class PromoBannerFacade implements IPromoBannerFacade {
  /**
   * Convierte una entidad en su DTO de respuesta, exponiendo la URL pública de
   * la imagen.
   */
  private mapToResponseDTO(banner: PromoBanner): IPromoBannerResponseDTO {
    return {
      ...banner,
      imageUrl: `/uploads/promo-banners/${banner.imageUrl}`,
    };
  }

  /**
   * Normaliza y valida los campos de enlace en función del `linkType`.
   */
  private async resolveLinkFields(
    linkType: PromoLinkType,
    linkProductId?: string | null,
    linkCategoryId?: number | null,
  ): Promise<LinkFieldsResult> {
    if (linkType === PromoLinkType.PRODUCT) {
      if (!linkProductId) {
        return {
          ok: false,
          error: {
            success: false,
            error: ERROR_CODES.VALIDATION_ERROR,
            message: 'Debe seleccionar un producto para el enlace.',
            statusCode: 400,
          },
        };
      }
      if (!(await service.productExists(linkProductId))) {
        return {
          ok: false,
          error: {
            success: false,
            error: ERROR_CODES.PRODUCT_NOT_FOUND,
            message: 'El producto del enlace no existe.',
            statusCode: 404,
          },
        };
      }
      return { ok: true, linkProductId, linkCategoryId: null };
    }

    if (linkType === PromoLinkType.CATEGORY) {
      if (linkCategoryId === undefined || linkCategoryId === null) {
        return {
          ok: false,
          error: {
            success: false,
            error: ERROR_CODES.VALIDATION_ERROR,
            message: 'Debe seleccionar una categoría para el enlace.',
            statusCode: 400,
          },
        };
      }
      if (!(await service.categoryExists(linkCategoryId))) {
        return {
          ok: false,
          error: {
            success: false,
            error: ERROR_CODES.CATEGORY_NOT_FOUND,
            message: 'La categoría del enlace no existe.',
            statusCode: 404,
          },
        };
      }
      return { ok: true, linkProductId: null, linkCategoryId };
    }

    // NONE → sin destino.
    return { ok: true, linkProductId: null, linkCategoryId: null };
  }

  /** Obtiene todos los banners de promoción como DTOs de respuesta. */
  async getAll(): Promise<FacadeResult<IPromoBannerResponseDTO[]>> {
    try {
      const banners = await service.findAllPromoBanners();
      return {
        success: true,
        data: banners.map((b) => this.mapToResponseDTO(b)),
        message: 'Banners de promoción obtenidos correctamente.',
      };
    } catch (error) {
      console.error('Error in getAll PromoBanner facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener los banners de promoción.',
        statusCode: 500,
      };
    }
  }

  /** Obtiene un banner por su ID, o un error 404 si no existe. */
  async getById(
    id: number,
  ): Promise<FacadeResult<IPromoBannerResponseDTO | null>> {
    try {
      const banner = await service.findPromoBannerById(id);
      if (!banner) {
        return {
          success: false,
          error: ERROR_CODES.PROMO_BANNER_NOT_FOUND,
          message: 'Banner de promoción no encontrado.',
          statusCode: 404,
        };
      }
      return {
        success: true,
        data: this.mapToResponseDTO(banner),
        message: 'Banner de promoción obtenido correctamente.',
      };
    } catch (error) {
      console.error('Error in getById PromoBanner facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al obtener el banner de promoción.',
        statusCode: 500,
      };
    }
  }

  /**
   * Crea un banner de promoción: valida el tope máximo, resuelve y verifica el
   * destino del enlace, procesa la imagen y le asigna la siguiente posición.
   */
  async create(
    data: IPromoBannerCreateRaw,
    file: Express.Multer.File,
  ): Promise<FacadeResult<IPromoBannerResponseDTO>> {
    try {
      const currentCount = await service.countPromoBanners();
      if (currentCount >= MAX_PROMO_BANNERS) {
        return {
          success: false,
          error: ERROR_CODES.MAX_ITEMS_REACHED,
          message: `Se ha alcanzado el límite máximo de ${MAX_PROMO_BANNERS} banners de promoción.`,
          statusCode: 400,
        };
      }

      const linkType = data.linkType as PromoLinkType;
      const linkCategoryId =
        data.linkCategoryId !== undefined && data.linkCategoryId !== ''
          ? Number(data.linkCategoryId)
          : null;

      const link = await this.resolveLinkFields(
        linkType,
        data.linkProductId ?? null,
        linkCategoryId,
      );
      if (!link.ok) return link.error;

      const imageName = await processAndSaveImage(file, 'promo-banners');
      const position = (await service.getMaxPromoBannerPosition()) + 1;

      const createDTO: ICreatePromoBannerDTO = {
        title: data.title?.trim() ? data.title.trim() : null,
        subtitle: data.subtitle?.trim() ? data.subtitle.trim() : null,
        imageUrl: imageName,
        position,
        linkType,
        linkProductId: link.linkProductId,
        linkCategoryId: link.linkCategoryId,
      };

      const created = await service.createPromoBanner(createDTO);
      return {
        success: true,
        data: this.mapToResponseDTO(created),
        message: 'Banner de promoción creado correctamente.',
      };
    } catch (error) {
      console.error('Error in create PromoBanner facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al crear el banner de promoción.',
        statusCode: 500,
      };
    }
  }

  /**
   * Actualiza un banner de promoción. Si cambia el `linkType`, recalcula los
   * campos de destino; si llega una nueva imagen, la procesa y borra la anterior.
   */
  async update(
    id: number,
    data: IPromoBannerUpdateRaw,
    file?: Express.Multer.File,
  ): Promise<FacadeResult<IPromoBannerResponseDTO>> {
    try {
      const existing = await service.findPromoBannerById(id);
      if (!existing) {
        return {
          success: false,
          error: ERROR_CODES.PROMO_BANNER_NOT_FOUND,
          message: 'Banner de promoción a actualizar no encontrado.',
          statusCode: 404,
        };
      }

      const updateDTO: IUpdatePromoBannerDTO = {};

      if (data.title !== undefined) {
        updateDTO.title = data.title.trim() ? data.title.trim() : null;
      }
      if (data.subtitle !== undefined) {
        updateDTO.subtitle = data.subtitle.trim() ? data.subtitle.trim() : null;
      }

      // Si cambia el tipo de enlace, se recalculan los campos de destino.
      if (data.linkType !== undefined) {
        const linkType = data.linkType as PromoLinkType;
        const linkCategoryId =
          data.linkCategoryId !== undefined && data.linkCategoryId !== ''
            ? Number(data.linkCategoryId)
            : null;
        const link = await this.resolveLinkFields(
          linkType,
          data.linkProductId ?? null,
          linkCategoryId,
        );
        if (!link.ok) return link.error;
        updateDTO.linkType = linkType;
        updateDTO.linkProductId = link.linkProductId;
        updateDTO.linkCategoryId = link.linkCategoryId;
      }

      // Reemplazo de imagen (borra la anterior del disco).
      if (file) {
        const newImage = await processAndSaveImage(file, 'promo-banners');
        updateDTO.imageUrl = newImage;
        const oldImagePath = path.join(
          getUploadsSubfolderPath('promo-banners'),
          existing.imageUrl,
        );
        await fs
          .unlink(oldImagePath)
          .catch((err) =>
            console.warn(
              `No se pudo eliminar la imagen antigua del banner: ${err.message}`,
            ),
          );
      }

      const updated = await service.updatePromoBanner(id, updateDTO);
      return {
        success: true,
        data: this.mapToResponseDTO(updated),
        message: 'Banner de promoción actualizado correctamente.',
      };
    } catch (error) {
      console.error('Error in update PromoBanner facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al actualizar el banner de promoción.',
        statusCode: 500,
      };
    }
  }

  /**
   * Elimina un banner de promoción, compacta las posiciones restantes y borra su
   * imagen del sistema de archivos.
   */
  async delete(id: number): Promise<FacadeResult<null>> {
    try {
      const existing = await service.findPromoBannerById(id);
      if (!existing) {
        return {
          success: false,
          error: ERROR_CODES.PROMO_BANNER_NOT_FOUND,
          message: 'Banner de promoción a eliminar no encontrado.',
          statusCode: 404,
        };
      }

      await service.deletePromoBannerAndShift(id, existing.position);

      const imagePath = path.join(
        getUploadsSubfolderPath('promo-banners'),
        existing.imageUrl,
      );
      await fs
        .unlink(imagePath)
        .catch((err) =>
          console.warn(
            `No se pudo eliminar la imagen del banner: ${err.message}`,
          ),
        );

      return {
        success: true,
        data: null,
        message: 'Banner de promoción eliminado correctamente.',
      };
    } catch (error) {
      console.error('Error in delete PromoBanner facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al eliminar el banner de promoción.',
        statusCode: 500,
      };
    }
  }

  /**
   * Reordena la totalidad de los banners. Valida que no haya IDs ni posiciones
   * duplicados, que las posiciones sean contiguas desde 1 y que se envíen todos
   * los banners existentes.
   */
  async reorder(
    items: IReorderPromoBannerItem[],
  ): Promise<FacadeResult<IPromoBannerResponseDTO[]>> {
    try {
      const idSet = new Set(items.map((i) => i.id));
      const positionSet = new Set(items.map((i) => i.position));

      if (idSet.size !== items.length) {
        return {
          success: false,
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'No se permiten IDs duplicados en el reordenamiento.',
          statusCode: 400,
        };
      }
      if (positionSet.size !== items.length) {
        return {
          success: false,
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'No se permiten posiciones duplicadas en el reordenamiento.',
          statusCode: 400,
        };
      }

      const sortedPositions = items
        .map((i) => i.position)
        .sort((a, b) => a - b);
      const contiguous = sortedPositions.every((v, idx) => v === idx + 1);
      if (!contiguous) {
        return {
          success: false,
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Las posiciones deben ser consecutivas iniciando en 1.',
          statusCode: 400,
        };
      }

      const total = await service.countPromoBanners();
      if (items.length !== total) {
        return {
          success: false,
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Debe enviar todos los banners para poder reordenar.',
          statusCode: 400,
        };
      }

      await service.reorderPromoBanners(items);
      const banners = await service.findAllPromoBanners();
      return {
        success: true,
        data: banners.map((b) => this.mapToResponseDTO(b)),
        message: 'Banners de promoción reordenados correctamente.',
      };
    } catch (error) {
      console.error('Error in reorder PromoBanner facade:', error);
      return {
        success: false,
        error: ERROR_CODES.INTERNAL_ERROR,
        message: 'Error al reordenar los banners de promoción.',
        statusCode: 500,
      };
    }
  }
}

export const promoBannerFacade = new PromoBannerFacade();
