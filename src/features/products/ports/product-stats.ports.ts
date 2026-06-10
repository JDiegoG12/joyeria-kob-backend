import { FacadeResult } from '../../../shared/types/facade';
import { TokenPayload } from '../../../api/middlewares/auth.middleware';
import {
  StatsQueryDTO,
  StatsResponseDTO,
  CategoryStatsResponseDTO,
  TopFavoriteProductDTO,
} from '../dtos/product-stats.dto';

/** Contrato de la fachada de estadísticas de productos. */
export interface IProductStatsFacade {
  /** Obtiene estadísticas de productos (totales y agrupaciones) según el rol. */
  getStats(
    user: TokenPayload,
    query: StatsQueryDTO,
  ): Promise<FacadeResult<StatsResponseDTO | CategoryStatsResponseDTO>>;

  /** Obtiene el top de productos más marcados como favoritos (solo ADMIN). */
  getTopFavoriteProducts(
    user: TokenPayload | undefined,
    limit: number,
  ): Promise<FacadeResult<TopFavoriteProductDTO[]>>;
}
