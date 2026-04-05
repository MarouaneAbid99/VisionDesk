import api from './api';
import type { PlatformSettings, ApiResponse } from '@/types';

interface UpdateSettingsInput {
  platformName?: string;
  defaultTimezone?: string;
  defaultCurrency?: string;
  maintenanceMode?: boolean;
}

export const settingsService = {
  async get(): Promise<PlatformSettings> {
    const response = await api.get<ApiResponse<PlatformSettings>>('/settings');
    return response.data.data;
  },

  async update(input: UpdateSettingsInput): Promise<PlatformSettings> {
    const response = await api.put<ApiResponse<PlatformSettings>>('/settings', input);
    return response.data.data;
  },
};
