import api, { setAuthToken, removeAuthToken } from './api';
import { LoginRequest, LoginResponse, User, ApiResponse } from '../types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    const { token, user, shop } = response.data.data;
    await setAuthToken(token);
    return { token, user, shop };
  },

  logout: async (): Promise<void> => {
    await removeAuthToken();
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },
};
