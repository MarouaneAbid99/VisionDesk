import api from './api';
import { ApiResponse } from '../types';

export interface Prescription {
  id: string;
  clientId: string;
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
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreatePrescriptionInput {
  clientId: string;
  odSph?: number | null;
  odCyl?: number | null;
  odAxis?: number | null;
  odAdd?: number | null;
  osSph?: number | null;
  osCyl?: number | null;
  osAxis?: number | null;
  osAdd?: number | null;
  pdFar?: number | null;
  pdNear?: number | null;
  doctorName?: string | null;
  notes?: string | null;
  expiresAt?: string | null;
}

export const prescriptionsService = {
  getByClient: async (clientId: string): Promise<Prescription[]> => {
    const response = await api.get<ApiResponse<Prescription[]>>(`/prescriptions/client/${clientId}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Prescription> => {
    const response = await api.get<ApiResponse<Prescription>>(`/prescriptions/${id}`);
    return response.data.data;
  },

  create: async (data: CreatePrescriptionInput): Promise<Prescription> => {
    const response = await api.post<ApiResponse<Prescription>>('/prescriptions', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreatePrescriptionInput>): Promise<Prescription> => {
    const response = await api.put<ApiResponse<Prescription>>(`/prescriptions/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/prescriptions/${id}`);
  },
};
