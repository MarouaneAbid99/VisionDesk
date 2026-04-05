import { z } from 'zod';

export const lensTypeEnum = z.enum(['SINGLE_VISION', 'BIFOCAL', 'PROGRESSIVE', 'READING', 'SUNGLASSES']);
export const lensCoatingEnum = z.enum(['NONE', 'ANTI_REFLECTIVE', 'BLUE_LIGHT', 'PHOTOCHROMIC', 'POLARIZED', 'SCRATCH_RESISTANT']);

export const createLensSchema = z.object({
  supplierId: z.string().uuid().optional().nullable(),
  name: z.string().min(1),
  lensType: lensTypeEnum.default('SINGLE_VISION'),
  index: z.string().optional().nullable(),
  coating: lensCoatingEnum.default('NONE'),
  quantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(5),
  purchasePrice: z.number().min(0).default(0),
  salePrice: z.number().min(0).default(0),
  barcode: z.string().optional().nullable(),
  minSphere: z.number().min(-25).max(25).optional().nullable(),
  maxSphere: z.number().min(-25).max(25).optional().nullable(),
  minCylinder: z.number().min(-10).max(10).optional().nullable(),
  maxCylinder: z.number().min(-10).max(10).optional().nullable(),
  maxAdd: z.number().min(0).max(4).optional().nullable(),
});

export const lensRecommendationSchema = z.object({
  sphere: z.number().min(-25).max(25).optional(),
  cylinder: z.number().min(-10).max(10).optional(),
  axis: z.number().int().min(0).max(180).optional(),
  add: z.number().min(0).max(4).optional(),
  lensType: lensTypeEnum.optional(),
});

export const updateLensSchema = createLensSchema.partial();

export const lensQuerySchema = z.object({
  search: z.string().optional(),
  lensType: z.enum(['SINGLE_VISION', 'BIFOCAL', 'PROGRESSIVE', 'READING', 'SUNGLASSES']).optional(),
  supplierId: z.string().uuid().optional(),
  lowStock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateLensInput = z.infer<typeof createLensSchema>;
export type UpdateLensInput = z.infer<typeof updateLensSchema>;
export type LensQuery = z.infer<typeof lensQuerySchema>;
export type LensRecommendationInput = z.infer<typeof lensRecommendationSchema>;
