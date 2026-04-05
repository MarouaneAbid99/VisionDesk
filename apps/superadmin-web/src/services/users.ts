import api from './api';
import type { User, Pagination, ApiResponse, UserRole } from '@/types';

interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

interface UsersQuery {
  search?: string;
  shopId?: string;
  role?: UserRole;
  isActive?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
}

export const usersService = {
  async findAll(query: UsersQuery = {}): Promise<UsersResponse> {
    const response = await api.get<ApiResponse<UsersResponse>>('/users', { params: query });
    return response.data.data;
  },

  async findById(id: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  async updateStatus(id: string, isActive: boolean): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/status`, { isActive });
    return response.data.data;
  },
};
