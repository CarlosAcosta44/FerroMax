import { z } from 'zod';

export const ProductFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  searchQuery: z.string().optional(),
  inStockOnly: z.boolean().optional(),
  featuredOnly: z.boolean().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
});

export type ProductFilterInput = z.infer<typeof ProductFilterSchema>;

export const UpdateStockSchema = z.object({
  productId: z.string().uuid(),
  newStock: z.number().int().nonnegative(),
});

export type UpdateStockInput = z.infer<typeof UpdateStockSchema>;
