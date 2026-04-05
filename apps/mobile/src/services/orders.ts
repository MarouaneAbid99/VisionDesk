import api from './api';
import { Order, OrderStatus, ApiResponse, PaginatedResponse } from '../types';

interface OrdersParams {
  search?: string;
  status?: OrderStatus | 'COMPLETED';
  page?: number;
  limit?: number;
}

interface OrdersApiResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateOrderInput {
  clientId: string;
  frameId?: string;
  lensId?: string;
  prescriptionId?: string;
  framePrice: number;
  lensPrice: number;
  servicePrice: number;
  discount: number;
  deposit?: number;
  notes?: string;
  dueDate?: string;
}

export const ordersService = {
  getAll: async (params: OrdersParams = {}): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<ApiResponse<OrdersApiResponse>>('/orders', { params });
    const { orders, pagination } = response.data.data;
    return {
      items: orders,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  create: async (data: CreateOrderInput): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data.data;
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
    return response.data.data;
  },

  addPayment: async (id: string, amount: number): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>(`/orders/${id}/payment`, { amount });
    return response.data.data;
  },

  getInvoice: async (id: string): Promise<InvoiceData> => {
    const response = await api.get<ApiResponse<InvoiceData>>(`/orders/${id}/invoice`);
    return response.data.data;
  },

  getPaymentHistory: async (id: string): Promise<PaymentRecord[]> => {
    const response = await api.get<ApiResponse<PaymentRecord[]>>(`/orders/${id}/payments`);
    return response.data.data;
  },
};

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export interface InvoiceData {
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  paymentStatusLabel?: string;
  invoice: {
    number: string;
    date: string;
    orderNumber: string;
    orderDate: string;
  };
  shop: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  items: Array<{
    type: string;
    description: string;
    details: string | null;
    price: number;
  }>;
  pricing: {
    subtotal: number;
    discount: number;
    total: number;
    deposit: number;
    remaining: number;
    isPaid: boolean;
  };
  /** API: always set. Fallback: prescription → linked, else not_linked */
  prescriptionPresence?: 'not_linked' | 'linked' | 'missing';
  prescription: {
    odSph: number | null;
    odCyl: number | null;
    odAxis: number | null;
    odAdd: number | null;
    osSph: number | null;
    osCyl: number | null;
    osAxis: number | null;
    osAdd: number | null;
    pdFar: number | null;
    pdNear: number | null;
    doctorName: string | null;
  } | null;
  createdBy: string | null;
}
