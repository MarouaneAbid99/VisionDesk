import api from './api';
import { DeskSummary, Order, Frame, Lens, AtelierJob, Appointment, ApiResponse } from '../types';

export const deskService = {
  getSummary: async (): Promise<DeskSummary> => {
    const response = await api.get<ApiResponse<DeskSummary>>('/desk/summary');
    return response.data.data;
  },

  getRecentOrders: async (): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>('/desk/recent-orders');
    return response.data.data;
  },

  getLowStock: async (): Promise<{ frames: Frame[]; lenses: Lens[] }> => {
    const response = await api.get<ApiResponse<{ frames: Frame[]; lenses: Lens[] }>>('/desk/low-stock');
    return response.data.data;
  },

  getAtelierQueue: async (): Promise<AtelierJob[]> => {
    const response = await api.get<ApiResponse<AtelierJob[]>>('/desk/atelier-queue');
    return response.data.data;
  },

  getTodayAppointments: async (): Promise<Appointment[]> => {
    const response = await api.get<ApiResponse<Appointment[]>>('/desk/appointments');
    return response.data.data;
  },

  getOverdueOrders: async (): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>('/desk/overdue-orders');
    return response.data.data;
  },

  getDelayedAtelier: async (): Promise<AtelierJob[]> => {
    const response = await api.get<ApiResponse<AtelierJob[]>>('/desk/delayed-atelier');
    return response.data.data;
  },

  getOrdersAnalytics: async (): Promise<{
    totalOrders: number;
    totalBookedRevenue: number;
    totalRevenue: number;
    ordersThisMonth: number;
    bookedRevenueThisMonth: number;
    revenueThisMonth: number;
    bookedRevenueLastMonth: number;
    bookedRevenueToday: number;
    averageOrderValue: number;
    monthOverMonthGrowth: string | null;
    bookedRevenueGrowth: string | null;
    revenueGrowth: string | null;
    collectedCashTotal: number;
    collectedCashThisMonth: number;
    collectedCashToday: number;
    completedRevenueTotal: number;
    completedRevenueThisMonth: number;
    completedRevenueToday: number;
    todayRevenue: number;
  }> => {
    const response = await api.get<ApiResponse<any>>('/desk/orders-analytics');
    return response.data.data;
  },

  getBestSellers: async (): Promise<{
    frames: Array<{ id: string; reference: string; brand?: { name: string }; salesCount: number; revenue: number }>;
    lenses: Array<{ id: string; name: string; salesCount: number; revenue: number }>;
  }> => {
    const response = await api.get<ApiResponse<any>>('/desk/best-sellers');
    return response.data.data;
  },

  getBusinessIntelligence: async (): Promise<{
    predictive: {
      ordersDueTomorrow: number;
      criticalStockItems: number;
      atelierStatus: 'normal' | 'busy' | 'overloaded';
      atelierLoad: number;
    };
    financial: {
      cashToCollect: number;
      unpaidOrdersCount: number;
      cashComing: number;
      readyOrdersCount: number;
      collectedCashToday: number;
      collectedCashThisMonth: number;
      bookedRevenueToday: number;
      bookedRevenueThisMonth: number;
      completedTodayRevenue: number;
      ordersCompletedToday: number;
    };
    insights: {
      topClient: { name: string; ordersCount: number; totalSpent: number } | null;
    };
  }> => {
    const response = await api.get<ApiResponse<any>>('/desk/business-intelligence');
    return response.data.data;
  },
};
