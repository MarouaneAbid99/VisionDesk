import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// API URL from environment - REQUIRED for public/external access
// Set EXPO_PUBLIC_API_URL in .env file
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Validate API URL is set - NO silent localhost fallback
if (!API_URL) {
  const errorMsg = `
[VisionDesk Mobile] EXPO_PUBLIC_API_URL is not set!

To fix this:
1. Create or edit apps/mobile/.env
2. Add: EXPO_PUBLIC_API_URL=https://YOUR_NGROK_SUBDOMAIN.ngrok-free.dev/api
3. Restart Expo with: npx expo start --tunnel --clear

For local Wi-Fi testing, use your machine's IP:
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001/api
`;
  console.error(errorMsg);
  if (__DEV__) {
    throw new Error('EXPO_PUBLIC_API_URL environment variable is required. Check console for setup instructions.');
  }
}

// Normalize API URL (remove trailing slash if present)
const normalizedApiUrl = API_URL!.replace(/\/$/, '');

// Export base URL for use in asset URL resolution
export const getApiBaseUrl = (): string => normalizedApiUrl;

// Get the origin (without /api suffix) for static assets
export const getApiOrigin = (): string => {
  return normalizedApiUrl.replace(/\/api$/, '');
};

// Build full URL for relative asset paths (uploads, panorama, etc.)
export const buildAssetUrl = (path: string | undefined | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiOrigin()}${normalizedPath}`;
};

// Web-compatible storage helpers (SecureStore doesn't work on web)
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const api: AxiosInstance = axios.create({
  baseURL: normalizedApiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
  },
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 carefully (don't logout on network errors)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Only clear token on genuine 401 from server, not network errors
    if (error.response?.status === 401) {
      if (__DEV__) {
        console.log('[API] 401 Unauthorized - clearing token');
      }
      await storage.removeItem('auth_token');
    }
    
    // Network errors - don't touch auth state
    if (!error.response) {
      if (__DEV__) {
        console.log('[API] Network error - not affecting auth state');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

export const setAuthToken = async (token: string) => {
  await storage.setItem('auth_token', token);
};

export const removeAuthToken = async () => {
  await storage.removeItem('auth_token');
};

export const getAuthToken = async () => {
  return await storage.getItem('auth_token');
};
