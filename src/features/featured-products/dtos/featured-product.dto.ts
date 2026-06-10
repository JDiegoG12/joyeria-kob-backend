import { z } from 'zod';

/**
 * Esquema para destacar un producto. Exige un `productId` con formato UUID.
 */
export const CreateFeaturedProductSchema = z.object({
  productId: z.string().uuid(),
});

/** Tipo inferido del esquema `CreateFeaturedProductSchema`. */
export type CreateFeaturedProductDto = z.infer<
  typeof CreateFeaturedProductSchema
>;

/**
 * Esquema para reordenar los productos destacados. Es un arreglo (de 1 a 6
 * elementos) donde cada entrada asocia un `productId` (UUID) con una `position`
 * entera entre 1 y 6.
 */
export const ReorderFeaturedProductsSchema = z
  .array(
    z.object({
      productId: z.string().uuid(),
      position: z.number().int().min(1).max(6),
    }),
  )
  .min(1)
  .max(6);

/** Tipo inferido del esquema `ReorderFeaturedProductsSchema`. */
export type ReorderFeaturedProductsDto = z.infer<
  typeof ReorderFeaturedProductsSchema
>;
