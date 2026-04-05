import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';

// Use VITE_API_URL in production, fallback to /api for dev proxy
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_ORIGIN = API_BASE_URL.startsWith('http')
  ? API_BASE_URL.replace(/\/api\/?$/, '')
  : '';

export const resolveApiAssetUrl = (assetPath?: string | null): string => {
  if (!assetPath) return '';
  if (assetPath.startsWith('http')) return assetPath;
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return API_ORIGIN ? `${API_ORIGIN}${normalizedPath}` : normalizedPath;
};

export const resolveApiUrl = (apiPath: string): string => {
  const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  if (API_BASE_URL.startsWith('http')) {
    return `${API_BASE_URL.replace(/\/$/, '')}${normalizedPath}`;
  }
  return `/api${normalizedPath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
  },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 carefully
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Only logout on genuine 401 from server, not network errors
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Don't logout if already on login page (prevents loops)
      if (currentPath === '/login') {
        return Promise.reject(error);
      }
      
      // Don't logout during initial session verification
      const { status } = useAuthStore.getState();
      if (status === 'loading') {
        if (import.meta.env.DEV) {
          console.log('[Auth] 401 during loading state, ignoring');
        }
        return Promise.reject(error);
      }
      
      if (import.meta.env.DEV) {
        console.log('[Auth] 401 received, logging out');
      }
      
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    // Network errors or other failures - don't touch auth state
    if (!error.response) {
      if (import.meta.env.DEV) {
        console.log('[Auth] Network error, not affecting auth state');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
