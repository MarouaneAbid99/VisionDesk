import { z } from 'zod';

export const ALLOWED_MODULE_KEYS = [
  'desk',
  'clients',
  'atelier',
  'frames',
  'lenses',
] as const;

export const moduleKeySchema = z.enum(ALLOWED_MODULE_KEYS);

export const createSceneSchema = z.object({
  name: z.string().min(1).max(255),
  isActive: z.boolean().optional(),
});

export const updateSceneSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
});

export const createHotspotSchema = z.object({
  sceneId: z.string().uuid(),
  moduleKey: moduleKeySchema,
  label: z.string().min(1).max(100),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1).default(0.1),
  h: z.number().min(0).max(1).default(0.1),
  icon: z.string().max(100).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateHotspotSchema = z.object({
  moduleKey: moduleKeySchema.optional(),
  label: z.string().min(1).max(100).optional(),
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  w: z.number().min(0).max(1).optional(),
  h: z.number().min(0).max(1).optional(),
  icon: z.string().max(100).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateHotspotPositionSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1).optional(),
  h: z.number().min(0).max(1).optional(),
});

export const updateHotspotStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateSceneInput = z.infer<typeof createSceneSchema>;
export type UpdateSceneInput = z.infer<typeof updateSceneSchema>;
export type CreateHotspotInput = z.infer<typeof createHotspotSchema>;
export type UpdateHotspotInput = z.infer<typeof updateHotspotSchema>;
export type UpdateHotspotPositionInput = z.infer<typeof updateHotspotPositionSchema>;
export type UpdateHotspotStatusInput = z.infer<typeof updateHotspotStatusSchema>;
