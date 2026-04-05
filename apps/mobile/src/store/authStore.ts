import { create } from 'zustand';
import { AxiosError } from 'axios';
import { User, Shop } from '../types';
import { authService } from '../services/auth';
import { getAuthToken } from '../services/api';

interface AuthState {
  user: User | null;
  shop: Shop | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  shop: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    if (__DEV__) {
      console.log('[Auth] Login attempt:', email);
    }
    const { token, user, shop } = await authService.login({ email, password });
    if (__DEV__) {
      console.log('[Auth] Login success:', user.email);
    }
    set({ user, shop, token, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    if (__DEV__) {
      console.log('[Auth] Logout');
    }
    await authService.logout();
    set({ user: null, shop: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        if (__DEV__) {
          console.log('[Auth] No token found');
        }
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }
      
      if (__DEV__) {
        console.log('[Auth] Token found, verifying...');
      }
      
      const user = await authService.getMe();
      if (__DEV__) {
        console.log('[Auth] Session verified:', user.email);
      }
      set({ user, token, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Only clear auth on genuine 401, not network errors
      if (axiosError.response?.status === 401) {
        if (__DEV__) {
          console.log('[Auth] Token invalid (401), clearing session');
        }
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return false;
      }
      
      // Network error - keep token, mark as not loading but preserve potential auth
      if (!axiosError.response) {
        if (__DEV__) {
          console.log('[Auth] Network error during checkAuth - keeping token');
        }
        // Keep the token, user might still be authenticated when network recovers
        const existingToken = await getAuthToken();
        set({ 
          token: existingToken, 
          isLoading: false, 
          isAuthenticated: !!existingToken 
        });
        return !!existingToken;
      }
      
      // Other errors - clear session
      if (__DEV__) {
        console.log('[Auth] checkAuth error:', axiosError.message);
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },

  setUser: (user: User) => {
    set({ user });
  },
}));
