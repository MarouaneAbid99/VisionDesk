import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  shopId: string;
  shop: {
    id: string;
    name: string;
    logo?: string;
  };
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  token: string | null;
  user: User | null;
  status: AuthStatus;
  isHydrated: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setHydrated: () => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      status: 'loading',
      isHydrated: false,
      isAuthenticated: false,
      setAuth: (token, user) => {
        if (import.meta.env.DEV) {
          console.log('[Auth] Login success, user:', user.email);
        }
        set({
          token,
          user,
          status: 'authenticated',
          isAuthenticated: true,
        });
      },
      logout: () => {
        if (import.meta.env.DEV) {
          console.log('[Auth] Logout');
        }
        set({
          token: null,
          user: null,
          status: 'unauthenticated',
          isAuthenticated: false,
        });
      },
      setHydrated: () => {
        const { token, user } = get();
        const hasValidSession = !!(token && user);
        if (import.meta.env.DEV) {
          console.log('[Auth] Hydrated from storage, hasSession:', hasValidSession);
        }
        set({
          isHydrated: true,
          status: hasValidSession ? 'authenticated' : 'unauthenticated',
          isAuthenticated: hasValidSession,
        });
      },
      setStatus: (status) => set({ status }),
    }),
    {
      name: 'visiondesk-auth',
      onRehydrateStorage: () => (state) => {
        // Called after hydration completes
        state?.setHydrated();
      },
    }
  )
);
