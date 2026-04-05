import api from './api';
import { Frame, Lens, ApiResponse, PaginatedResponse, LensType, LensCoating } from '../types';

interface StockParams {
  search?: string;
  lowStock?: boolean;
  supplierId?: string;
  page?: number;
  limit?: number;
}

export interface CreateFrameInput {
  reference: string;
  supplierId?: string;
  brandId?: string;
  model?: string;
  color?: string;
  size?: string;
  material?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  reorderLevel?: number;
}

export interface CreateLensInput {
  name: string;
  supplierId?: string;
  lensType: LensType;
  index?: string;
  coating?: LensCoating;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  reorderLevel?: number;
}

interface FramesApiResponse {
  frames: Frame[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LensesApiResponse {
  lenses: Lens[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StockSummary {
  frames: { totalItems: number; totalQuantity: number; lowStock: number };
  lenses: { totalItems: number; totalQuantity: number; lowStock: number };
  totalLowStock: number;
}

export interface LowStockData {
  frames: Frame[];
  lenses: Lens[];
  totalLowStock: number;
}

export const stockService = {
  getFrames: async (params: StockParams = {}): Promise<PaginatedResponse<Frame>> => {
    const response = await api.get<ApiResponse<FramesApiResponse>>('/frames', { params });
    const { frames, pagination } = response.data.data;
    return {
      items: frames,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  },

  getLenses: async (params: StockParams = {}): Promise<PaginatedResponse<Lens>> => {
    const response = await api.get<ApiResponse<LensesApiResponse>>('/lenses', { params });
    const { lenses, pagination } = response.data.data;
    return {
      items: lenses,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  },

  getSummary: async (): Promise<StockSummary> => {
    const response = await api.get<ApiResponse<StockSummary>>('/stock/summary');
    return response.data.data;
  },

  getLowStock: async (): Promise<LowStockData> => {
    const response = await api.get<ApiResponse<LowStockData>>('/stock/low-stock');
    return response.data.data;
  },

  // Frame CRUD
  getFrameById: async (id: string): Promise<Frame> => {
    const response = await api.get<ApiResponse<Frame>>(`/frames/${id}`);
    return response.data.data;
  },

  createFrame: async (data: CreateFrameInput): Promise<Frame> => {
    const response = await api.post<ApiResponse<Frame>>('/frames', data);
    return response.data.data;
  },

  updateFrame: async (id: string, data: Partial<CreateFrameInput>): Promise<Frame> => {
    const response = await api.patch<ApiResponse<Frame>>(`/frames/${id}`, data);
    return response.data.data;
  },

  updateFrameQuantity: async (id: string, quantity: number): Promise<Frame> => {
    const response = await api.patch<ApiResponse<Frame>>(`/frames/${id}`, { quantity });
    return response.data.data;
  },

  // Lens CRUD
  getLensById: async (id: string): Promise<Lens> => {
    const response = await api.get<ApiResponse<Lens>>(`/lenses/${id}`);
    return response.data.data;
  },

  createLens: async (data: CreateLensInput): Promise<Lens> => {
    const response = await api.post<ApiResponse<Lens>>('/lenses', data);
    return response.data.data;
  },

  updateLens: async (id: string, data: Partial<CreateLensInput>): Promise<Lens> => {
    const response = await api.patch<ApiResponse<Lens>>(`/lenses/${id}`, data);
    return response.data.data;
  },

  updateLensQuantity: async (id: string, quantity: number): Promise<Lens> => {
    const response = await api.patch<ApiResponse<Lens>>(`/lenses/${id}`, { quantity });
    return response.data.data;
  },
};
