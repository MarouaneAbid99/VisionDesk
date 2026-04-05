import api from './api';
import { Client, ApiResponse, PaginatedResponse } from '../types';

interface ClientsParams {
  search?: string;
  page?: number;
  limit?: number;
}

interface ClientsApiResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateClientInput {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

export const clientsService = {
  getAll: async (params: ClientsParams = {}): Promise<PaginatedResponse<Client>> => {
    const response = await api.get<ApiResponse<ClientsApiResponse>>('/clients', { params });
    const { clients, pagination } = response.data.data;
    return {
      items: clients,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  },

  getById: async (id: string): Promise<Client> => {
    const response = await api.get<ApiResponse<Client>>(`/clients/${id}`);
    return response.data.data;
  },

  create: async (data: CreateClientInput): Promise<Client> => {
    const response = await api.post<ApiResponse<Client>>('/clients', data);
    return response.data.data;
  },
};
