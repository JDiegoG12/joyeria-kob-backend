import { z } from 'zod';

export const CreateFeaturedProductSchema = z.object({
  productId: z.string().uuid(),
});

export type CreateFeaturedProductDto = z.infer<
  typeof CreateFeaturedProductSchema
>;

export const ReorderFeaturedProductsSchema = z
  .array(
    z.object({
      productId: z.string().uuid(),
      position: z.number().int().min(1).max(6),
    }),
  )
  .min(1)
  .max(6);

export type ReorderFeaturedProductsDto = z.infer<
  typeof ReorderFeaturedProductsSchema
>;
