import api from './api';
import { ApiResponse, PaginatedResponse, Supplier } from '../types';

interface SuppliersParams {
  search?: string;
  page?: number;
  limit?: number;
}

interface SuppliersApiResponse {
  suppliers: Supplier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateSupplierInput {
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export type SupplierMetricsPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

export interface SupplierBusinessMetrics {
  period: SupplierMetricsPeriod;
  ordersCount: number;
  orderLinesAttributed: number;
  saleValueTotal: number;
  purchaseCostEstimated: number;
  estimatedProfit: number;
  methodology: {
    revenue: string;
    cost: string;
    limitation: string;
  };
  recentSales: Array<{
    orderId: string;
    orderNumber: string;
    createdAt: string;
    clientName: string | null;
    parts: Array<{ kind: 'frame' | 'lens'; amount: number; label: string }>;
  }>;
  recentStockMovementsIn: Array<{
    id: string;
    createdAt: string;
    quantity: number;
    reason: string | null;
    reference: string | null;
    productLabel: string;
    kind: 'frame' | 'lens';
  }>;
}

export const suppliersService = {
  getAll: async (params: SuppliersParams = {}): Promise<PaginatedResponse<Supplier>> => {
    const response = await api.get<ApiResponse<Supplier[] | SuppliersApiResponse>>('/suppliers', { params });
    const raw = response.data.data;
    const list: Supplier[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as SuppliersApiResponse)?.suppliers)
        ? (raw as SuppliersApiResponse).suppliers
        : [];
    const pagination = Array.isArray(raw)
      ? { page: 1, limit: list.length, total: list.length, totalPages: 1 }
      : (raw as SuppliersApiResponse).pagination ?? {
          page: 1,
          limit: list.length,
          total: list.length,
          totalPages: 1,
        };
    if (__DEV__ && list.length === 0) {
      console.log('[suppliersService.getAll] empty list — raw isArray=', Array.isArray(raw));
    }
    return {
      items: list,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  },

  create: async (data: CreateSupplierInput): Promise<Supplier> => {
    const response = await api.post<ApiResponse<Supplier>>('/suppliers', data);
    return response.data.data;
  },

  getById: async (id: string): Promise<Supplier> => {
    const response = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateSupplierInput>): Promise<Supplier> => {
    const response = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
    return response.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },

  getBusinessMetrics: async (
    id: string,
    period: SupplierMetricsPeriod = 'month'
  ): Promise<SupplierBusinessMetrics> => {
    const response = await api.get<ApiResponse<SupplierBusinessMetrics>>(`/suppliers/${id}/business-metrics`, {
      params: { period },
    });
    return response.data.data;
  },
};
