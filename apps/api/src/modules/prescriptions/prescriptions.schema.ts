import { z } from 'zod';

export const createPrescriptionSchema = z.object({
  clientId: z.string().uuid(),
  odSph: z.number().min(-25).max(25).optional().nullable(),
  odCyl: z.number().min(-10).max(10).optional().nullable(),
  odAxis: z.number().int().min(0).max(180).optional().nullable(),
  odAdd: z.number().min(0).max(4).optional().nullable(),
  osSph: z.number().min(-25).max(25).optional().nullable(),
  osCyl: z.number().min(-10).max(10).optional().nullable(),
  osAxis: z.number().int().min(0).max(180).optional().nullable(),
  osAdd: z.number().min(0).max(4).optional().nullable(),
  pdFar: z.number().min(40).max(80).optional().nullable(),
  pdNear: z.number().min(40).max(80).optional().nullable(),
  doctorName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export const updatePrescriptionSchema = createPrescriptionSchema.partial().omit({ clientId: true });

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionSchema>;
