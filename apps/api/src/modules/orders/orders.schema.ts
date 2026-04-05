import { z } from 'zod';

export const createOrderSchema = z.object({
  clientId: z.string().uuid(),
  prescriptionId: z.string().uuid().optional().nullable(),
  frameId: z.string().uuid().optional().nullable(),
  lensId: z.string().uuid().optional().nullable(),
  framePrice: z.number().min(0).default(0),
  lensPrice: z.number().min(0).default(0),
  servicePrice: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  deposit: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

// Pricing fields are IMMUTABLE after order creation.
// Only non-pricing fields can be updated via PATCH.
export const updateOrderSchema = z.object({
  clientId: z.string().uuid().optional(),
  prescriptionId: z.string().uuid().optional().nullable(),
  frameId: z.string().uuid().optional().nullable(),
  lensId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

// Fields explicitly excluded from updates (immutable after creation):
// - framePrice, lensPrice, servicePrice, discount, deposit, totalPrice

// READY_FOR_PICKUP is a legacy alias and should not be used by clients.
export const orderStatusEnum = z.enum(['DRAFT', 'CONFIRMED', 'IN_ATELIER', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED']);

export const updateOrderStatusSchema = z.object({
  status: orderStatusEnum,
});

const orderQueryStatusEnum = z.enum([
  'DRAFT',
  'CONFIRMED',
  'IN_ATELIER',
  'READY',
  'PICKED_UP',
  'DELIVERED',
  'CANCELLED',
  'COMPLETED',
]);

export const orderQuerySchema = z.object({
  search: z.string().optional(),
  status: orderQueryStatusEnum.optional(),
  clientId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
