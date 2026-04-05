import { z } from 'zod';

export const updateAtelierJobSchema = z.object({
  technicianId: z.string().uuid().optional().nullable(),
  priority: z.number().int().min(0).max(10).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  blockedReason: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  technicianNotes: z.string().optional().nullable(),
});

export const updateAtelierJobStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY']),
});

export const atelierQuerySchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY']).optional(),
  technicianId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type UpdateAtelierJobInput = z.infer<typeof updateAtelierJobSchema>;
export type UpdateAtelierJobStatusInput = z.infer<typeof updateAtelierJobStatusSchema>;
export type AtelierQuery = z.infer<typeof atelierQuerySchema>;
