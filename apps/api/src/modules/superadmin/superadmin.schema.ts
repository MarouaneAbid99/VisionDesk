import { z } from 'zod';

export const superadminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createShopSchema = z.object({
  name: z.string().min(1).max(255),
  legalName: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  currency: z.string().max(10).default('EUR'),
  timezone: z.string().max(50).default('Europe/Paris'),
});

export const updateShopSchema = createShopSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const shopQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false', 'all']).optional().default('all'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const usersQuerySchema = z.object({
  search: z.string().optional(),
  shopId: z.string().uuid().optional(),
  role: z.enum(['SUPERADMIN', 'OWNER', 'ADMIN', 'OPTICIAN', 'TECHNICIAN']).optional(),
  isActive: z.enum(['true', 'false', 'all']).optional().default('all'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const activityLogsQuerySchema = z.object({
  shopId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const updatePlatformSettingsSchema = z.object({
  platformName: z.string().min(1).max(255).optional(),
  defaultTimezone: z.string().max(50).optional(),
  defaultCurrency: z.string().max(10).optional(),
  maintenanceMode: z.boolean().optional(),
});

export type SuperadminLoginInput = z.infer<typeof superadminLoginSchema>;
export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type ShopQuery = z.infer<typeof shopQuerySchema>;
export type UsersQuery = z.infer<typeof usersQuerySchema>;
export type ActivityLogsQuery = z.infer<typeof activityLogsQuerySchema>;
export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;
