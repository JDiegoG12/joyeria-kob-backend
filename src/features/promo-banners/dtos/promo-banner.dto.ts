import { PromoBanner, PromoLinkType } from '@prisma/client';

/**
 * Tipos base y reutilizables para los banners de promoción del carrusel.
 */
export { PromoLinkType };

/**
 * 1. DTO para la creación de un banner de promoción.
 * Es lo que el servicio espera recibir tras la validación (la imagen ya
 * procesada y la posición ya calculada por la fachada).
 */
export interface ICreatePromoBannerDTO {
  title?: string | null;
  subtitle?: string | null;
  imageUrl: string; // Nombre del archivo ya procesado.
  position: number;
  linkType: PromoLinkType;
  linkProductId?: string | null;
  linkCategoryId?: number | null;
}

/**
 * 2. DTO para la actualización de un banner de promoción.
 * Todos los campos de negocio son opcionales; la imagen y posición se manejan
 * por separado en la fachada.
 */
export type IUpdatePromoBannerDTO = Partial<
  Omit<ICreatePromoBannerDTO, 'position'>
>;

/**
 * 3. DTO de respuesta. Devuelve `imageUrl` como ruta relativa completa
 * (`/uploads/promo-banners/...`) lista para que el cliente la resuelva con su
 * SERVER_URL, igual que el banner principal y el contenido social.
 */
export interface IPromoBannerResponseDTO
  extends Omit<PromoBanner, 'imageUrl'> {
  imageUrl: string;
}

/**
 * 4. Datos crudos del formulario (FormData) para crear.
 * Llegan como `string` desde `multipart/form-data`. La imagen va en `req.file`.
 */
export interface IPromoBannerCreateRaw {
  title?: string;
  subtitle?: string;
  linkType: string;
  linkProductId?: string;
  linkCategoryId?: string;
}

/**
 * 5. Datos crudos del formulario para actualizar (todos opcionales).
 */
export type IPromoBannerUpdateRaw = Partial<IPromoBannerCreateRaw>;

/**
 * 6. Item del reordenamiento: id del banner + nueva posición.
 */
export interface IReorderPromoBannerItem {
  id: number;
  position: number;
}
