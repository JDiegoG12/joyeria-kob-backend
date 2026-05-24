import { z } from 'zod';

export const FavoriteProductIdSchema = z.object({
  productId: z.string().uuid(),
});

export type FavoriteProductIdDto = z.infer<typeof FavoriteProductIdSchema>;
