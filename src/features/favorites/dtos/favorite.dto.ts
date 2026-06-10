import { z } from 'zod';

/**
 * Esquema de validación del identificador de producto usado en favoritos.
 * Exige que `productId` sea un UUID válido.
 */
export const FavoriteProductIdSchema = z.object({
  productId: z.string().uuid(),
});

/** Tipo inferido del esquema `FavoriteProductIdSchema`. */
export type FavoriteProductIdDto = z.infer<typeof FavoriteProductIdSchema>;
