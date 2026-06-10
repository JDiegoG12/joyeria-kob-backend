import { FacadeResult } from '../../../shared/types/facade';
import {
  ICreateSocialContentDTO,
  ISocialContentGetResponseDTO,
  IUpdateSocialContentDTO,
  ISocialContentUpdateResponseDTO,
} from '../dtos/social-content.dto';

/**
 * Contrato que define las operaciones de negocio para el módulo de Contenido Social.
 * La fachada (`facade`) implementará esta interfaz.
 */
export interface ISocialContentFacade {
  /**
   * Obtiene todos los contenidos sociales.
   */
  getAll(): Promise<FacadeResult<ISocialContentGetResponseDTO[]>>;

  /**
   * Obtiene un contenido social por su ID.
   */
  getById(
    id: number,
  ): Promise<FacadeResult<ISocialContentGetResponseDTO | null>>;

  /**
   * Crea un nuevo contenido social.
   */
  create(
    data: Omit<ICreateSocialContentDTO, 'imageUrl'>, // El controlador envía los datos sin el nombre de la imagen final
    file: Express.Multer.File,
  ): Promise<FacadeResult<ISocialContentGetResponseDTO>>;

  /**
   * Actualiza un contenido social existente.
   */
  update(
    id: number,
    data: IUpdateSocialContentDTO,
    file?: Express.Multer.File,
  ): Promise<FacadeResult<ISocialContentUpdateResponseDTO>>;

  /**
   * Elimina un contenido social por su ID.
   */
  delete(id: number): Promise<FacadeResult<null>>;
}
