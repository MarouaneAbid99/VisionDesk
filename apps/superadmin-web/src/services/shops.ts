import api from './api';
import type { Shop, Pagination, ApiResponse } from '@/types';

interface ShopsResponse {
  shops: Shop[];
  pagination: Pagination;
}

interface ShopQuery {
  search?: string;
  isActive?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
}

interface CreateShopInput {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface UpdateShopInput extends Partial<CreateShopInput> {
  isActive?: boolean;
}

export const shopsService = {
  async findAll(query: ShopQuery = {}): Promise<ShopsResponse> {
    const response = await api.get<ApiResponse<ShopsResponse>>('/shops', { params: query });
    return response.data.data;
  },

  async findById(id: string): Promise<Shop> {
    const response = await api.get<ApiResponse<Shop>>(`/shops/${id}`);
    return response.data.data;
  },

  async create(input: CreateShopInput): Promise<Shop> {
    const response = await api.post<ApiResponse<Shop>>('/shops', input);
    return response.data.data;
  },

  async update(id: string, input: UpdateShopInput): Promise<Shop> {
    const response = await api.put<ApiResponse<Shop>>(`/shops/${id}`, input);
    return response.data.data;
  },

  async updateStatus(id: string, isActive: boolean): Promise<Shop> {
    const response = await api.patch<ApiResponse<Shop>>(`/shops/${id}/status`, { isActive });
    return response.data.data;
  },
};
