import { z } from 'zod';

export const appointmentTypeEnum = z.enum(['EYE_EXAM', 'CONTACT_LENS', 'PICKUP', 'REPAIR', 'OTHER']);
export const appointmentStatusEnum = z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']);

export const createAppointmentSchema = z.object({
  clientId: z.string().uuid(),
  appointmentType: appointmentTypeEnum.default('OTHER'),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  notes: z.string().max(2000).optional(),
});

export const updateAppointmentSchema = z.object({
  clientId: z.string().uuid().optional(),
  appointmentType: appointmentTypeEnum.optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusEnum,
});

export const appointmentQuerySchema = z.object({
  search: z.string().optional(),
  status: appointmentStatusEnum.optional(),
  appointmentType: appointmentTypeEnum.optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>;
