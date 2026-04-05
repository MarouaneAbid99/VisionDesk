import { z } from 'zod';

export const createFrameSchema = z.object({
  brandId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  reference: z.string().min(1),
  model: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  quantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(5),
  purchasePrice: z.number().min(0).default(0),
  salePrice: z.number().min(0).default(0),
  barcode: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

export const updateFrameSchema = createFrameSchema.partial();

export const frameQuerySchema = z.object({
  search: z.string().optional(),
  brandId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  lowStock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateFrameInput = z.infer<typeof createFrameSchema>;
export type UpdateFrameInput = z.infer<typeof updateFrameSchema>;
export type FrameQuery = z.infer<typeof frameQuerySchema>;
