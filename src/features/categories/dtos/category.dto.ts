import { z } from 'zod';

// Schema for creating a category
export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  parentId: z.number().int().positive().optional().nullable(),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

// Schema for updating a category
export const UpdateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').optional(),
  description: z.string().optional().nullable(),
  parentId: z.number().int().positive().optional().nullable(),
});

export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
