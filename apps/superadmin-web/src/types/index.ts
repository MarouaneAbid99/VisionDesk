export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  shop?: ShopSummary;
}

export interface ShopSummary {
  id: string;
  name: string;
}

export type UserRole = 'SUPERADMIN' | 'OWNER' | 'ADMIN' | 'OPTICIAN' | 'TECHNICIAN';

export interface Shop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    clients: number;
    orders: number;
    frames: number;
    lenses: number;
    atelierJobs?: number;
  };
  users?: User[];
  recentActivity?: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  shopId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  shop?: ShopSummary;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface DashboardSummary {
  stats: {
    totalShops: number;
    activeShops: number;
    inactiveShops: number;
    totalUsers: number;
    totalClients: number;
    totalOrders: number;
    totalFrames: number;
    totalLenses: number;
  };
  recentShops: Array<Shop & { _count: { users: number; orders: number } }>;
  recentActivity: ActivityLog[];
}

export interface PlatformSettings {
  platformName: string;
  defaultTimezone: string;
  defaultCurrency: string;
  maintenanceMode: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
