import { FacadeResult } from '../../../shared/types/facade';
import {
  IPromoBannerResponseDTO,
  IPromoBannerCreateRaw,
  IPromoBannerUpdateRaw,
  IReorderPromoBannerItem,
} from '../dtos/promo-banner.dto';

/**
 * Contrato de operaciones de negocio del módulo de Banners de Promoción.
 * La fachada (`facade`) implementa esta interfaz.
 */
export interface IPromoBannerFacade {
  /** Obtiene todos los banners ordenados por posición ascendente. */
  getAll(): Promise<FacadeResult<IPromoBannerResponseDTO[]>>;

  /** Obtiene un banner por su ID. */
  getById(id: number): Promise<FacadeResult<IPromoBannerResponseDTO | null>>;

  /** Crea un nuevo banner (valida tope, destino del enlace y procesa imagen). */
  create(
    data: IPromoBannerCreateRaw,
    file: Express.Multer.File,
  ): Promise<FacadeResult<IPromoBannerResponseDTO>>;

  /** Actualiza un banner existente. */
  update(
    id: number,
    data: IPromoBannerUpdateRaw,
    file?: Express.Multer.File,
  ): Promise<FacadeResult<IPromoBannerResponseDTO>>;

  /** Elimina un banner y compacta las posiciones restantes. */
  delete(id: number): Promise<FacadeResult<null>>;

  /** Reordena la totalidad de los banners según las posiciones recibidas. */
  reorder(
    items: IReorderPromoBannerItem[],
  ): Promise<FacadeResult<IPromoBannerResponseDTO[]>>;
}
