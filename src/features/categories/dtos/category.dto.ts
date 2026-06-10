import { z } from 'zod';

/**
 * Esquema de validación para crear una categoría.
 * Exige `name`; `description` es opcional y `parentId` (entero positivo) puede
 * ser nulo para indicar una categoría raíz.
 */
export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  parentId: z.number().int().positive().optional().nullable(),
});

/** Tipo inferido del esquema `CreateCategorySchema`. */
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

/**
 * Esquema de validación para actualizar una categoría.
 * Todos los campos son opcionales para permitir actualizaciones parciales.
 */
export const UpdateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').optional(),
  description: z.string().optional().nullable(),
  parentId: z.number().int().positive().optional().nullable(),
});

/** Tipo inferido del esquema `UpdateCategorySchema`. */
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
