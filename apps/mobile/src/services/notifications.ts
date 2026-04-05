import api from './api';
import { ApiResponse } from '../types';

export interface Notification {
  id: string;
  shopId: string;
  userId: string | null;
  type: 'ORDER_READY' | 'STOCK_ALERT' | 'APPOINTMENT_REMINDER' | 'PAYMENT_RECEIVED' | 'SYSTEM';
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface NotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export const notificationsService = {
  getAll: async (params: NotificationsParams = {}): Promise<NotificationsResponse> => {
    const response = await api.get<ApiResponse<NotificationsResponse>>('/notifications', { params });
    return response.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data.data.count;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return response.data.data;
  },

  markAllAsRead: async (): Promise<{ count: number }> => {
    const response = await api.patch<ApiResponse<{ count: number }>>('/notifications/read-all');
    return response.data.data;
  },
};
