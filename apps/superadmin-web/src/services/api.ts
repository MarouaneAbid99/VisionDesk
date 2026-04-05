import axios from 'axios';

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

const api = axios.create({
  baseURL: `${API_BASE_URL}/superadmin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('superadmin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('superadmin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
