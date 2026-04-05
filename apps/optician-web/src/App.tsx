import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AuthLayout } from './layouts/AuthLayout';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './features/auth/LoginPage';
import { PanoramaPage } from './features/panorama/PanoramaPage';
import { PanoramaManagementPage } from './features/panorama/PanoramaManagementPage';
import { DeskPage } from './features/desk/DeskPage';
import { ClientsPage } from './features/clients/ClientsPage';
import { ClientDetailPage } from './features/clients/ClientDetailPage';
import { ClientFormPage } from './features/clients/ClientFormPage';
import { OrdersPage } from './features/orders/OrdersPage';
import { OrderDetailPage } from './features/orders/OrderDetailPage';
import { OrderBuilderPage } from './features/orders/OrderBuilderPage';
import { AtelierPage } from './features/atelier/AtelierPage';
import { FramesPage } from './features/frames/FramesPage';
import { LensesPage } from './features/lenses/LensesPage';
import { StockIntelligencePage } from './features/stock/StockIntelligencePage';
import { SuppliersPage } from './features/suppliers/SuppliersPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AppointmentsPage } from './features/appointments/AppointmentsPage';
import api from './lib/api';

// Loading spinner for auth initialization
function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Chargement…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isHydrated, status, token, setAuth, logout } = useAuthStore();
  
  // Verify session on mount if we have a token
  useEffect(() => {
    if (isHydrated && token && status === 'authenticated') {
      // Verify token is still valid by calling /auth/me
      api.get('/auth/me')
        .then((response) => {
          const user = response.data.data;
          if (import.meta.env.DEV) {
            console.log('[Auth] Session verified, user:', user.email);
          }
          // Update user data in case it changed
          setAuth(token, user);
        })
        .catch((error) => {
          if (error.response?.status === 401) {
            if (import.meta.env.DEV) {
              console.log('[Auth] Session invalid, clearing');
            }
            logout();
          }
          // Network errors - keep session, don't logout
        });
    }
  }, [isHydrated]); // Only run once after hydration
  
  // Wait for auth to hydrate from storage
  if (!isHydrated) {
    return <AuthLoading />;
  }
  
  // After hydration, check if authenticated
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<PanoramaPage />} />
        <Route path="/desk" element={<DeskPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/new" element={<ClientFormPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/clients/:id/edit" element={<ClientFormPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/new" element={<OrderBuilderPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/orders/:id/edit" element={<OrderBuilderPage />} />
        <Route path="/atelier" element={<AtelierPage />} />
        <Route path="/stock/frames" element={<FramesPage />} />
        <Route path="/stock/lenses" element={<LensesPage />} />
        <Route path="/stock/intelligence" element={<StockIntelligencePage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/panorama" element={<PanoramaManagementPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
