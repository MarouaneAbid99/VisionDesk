import api from './api';
import { AtelierJob, AtelierStatus, ApiResponse, PaginatedResponse } from '../types';

interface AtelierParams {
  status?: AtelierStatus;
  page?: number;
  limit?: number;
}

interface AtelierApiResponse {
  jobs: AtelierJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const atelierService = {
  getJobs: async (params: AtelierParams = {}): Promise<PaginatedResponse<AtelierJob>> => {
    const response = await api.get<ApiResponse<AtelierApiResponse>>('/atelier/jobs', { params });
    const { jobs, pagination } = response.data.data;
    return {
      items: jobs,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  },

  getJobById: async (id: string): Promise<AtelierJob> => {
    const response = await api.get<ApiResponse<AtelierJob>>(`/atelier/jobs/${id}`);
    return response.data.data;
  },

  updateJobStatus: async (id: string, status: AtelierStatus): Promise<AtelierJob> => {
    const response = await api.patch<ApiResponse<AtelierJob>>(`/atelier/jobs/${id}/status`, { status });
    return response.data.data;
  },
};
