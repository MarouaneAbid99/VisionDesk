import api from './api';
import type { ActivityLog, Pagination, ApiResponse } from '@/types';

interface ActivityLogsResponse {
  logs: ActivityLog[];
  pagination: Pagination;
}

interface ActivityLogsQuery {
  shopId?: string;
  entityType?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export const activityLogsService = {
  async findAll(query: ActivityLogsQuery = {}): Promise<ActivityLogsResponse> {
    const response = await api.get<ApiResponse<ActivityLogsResponse>>('/activity-logs', { params: query });
    return response.data.data;
  },
};
