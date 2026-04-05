import api from './api';
import { Appointment, ApiResponse, AppointmentStatus } from '../types';

interface AppointmentsResponse {
  appointments: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AppointmentQuery {
  search?: string;
  status?: AppointmentStatus;
  clientId?: string;
  page?: number;
  limit?: number;
}

interface CreateAppointmentInput {
  clientId: string;
  appointmentType: 'EYE_EXAM' | 'CONTACT_LENS' | 'PICKUP' | 'REPAIR' | 'OTHER';
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
}

export const appointmentsService = {
  getAll: async (query: AppointmentQuery = {}): Promise<AppointmentsResponse> => {
    const response = await api.get<ApiResponse<AppointmentsResponse>>('/appointments', { params: query });
    return response.data.data;
  },

  getUpcoming: async (limit: number = 10): Promise<Appointment[]> => {
    const response = await api.get<ApiResponse<Appointment[]>>('/appointments/upcoming', { params: { limit } });
    return response.data.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const response = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return response.data.data;
  },

  updateStatus: async (id: string, status: AppointmentStatus): Promise<Appointment> => {
    const response = await api.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status });
    return response.data.data;
  },

  create: async (data: CreateAppointmentInput): Promise<Appointment> => {
    const response = await api.post<ApiResponse<Appointment>>('/appointments', data);
    return response.data.data;
  },
};
