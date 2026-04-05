import api from './api';
import type { DashboardSummary, ApiResponse } from '@/types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return response.data.data;
  },
};
