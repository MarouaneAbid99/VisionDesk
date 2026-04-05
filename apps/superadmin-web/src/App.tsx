import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ShopsPage } from '@/pages/ShopsPage';
import { ShopDetailPage } from '@/pages/ShopDetailPage';
import { ShopPanoramaPage } from '@/pages/ShopPanoramaPage';
import { UsersPage } from '@/pages/UsersPage';
import { ActivityLogsPage } from '@/pages/ActivityLogsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { MainLayout } from '@/components/layout/MainLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/shops" element={<ShopsPage />} />
                <Route path="/shops/:id" element={<ShopDetailPage />} />
                <Route path="/shops/:shopId/panorama" element={<ShopPanoramaPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/activity-logs" element={<ActivityLogsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
