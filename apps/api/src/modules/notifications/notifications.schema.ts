import { z } from 'zod';

export const notificationTypeEnum = z.enum([
  'APPOINTMENT_SOON',
  'APPOINTMENT_OVERDUE',
  'ORDER_READY',
  'ORDER_OVERDUE',
  'LOW_STOCK',
  'ATELIER_BLOCKED',
  'ATELIER_URGENT',
]);

export const createNotificationSchema = z.object({
  type: notificationTypeEnum,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  entityType: z.string().max(50).optional(),
  entityId: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>;
