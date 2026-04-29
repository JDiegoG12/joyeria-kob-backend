import { FacadeResult } from '../../../shared/types/facade';
import { TokenPayload } from '../../../api/middlewares/auth.middleware';
import {
  StatsQueryDTO,
  StatsResponseDTO,
  CategoryStatsResponseDTO,
} from '../dtos/product-stats.dto';

export interface IProductStatsFacade {
  // Updated return type
  getStats(
    user: TokenPayload,
    query: StatsQueryDTO,
  ): Promise<FacadeResult<StatsResponseDTO | CategoryStatsResponseDTO>>;
}
