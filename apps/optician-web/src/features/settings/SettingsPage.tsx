import { Link } from 'react-router-dom';
import { Image, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {isAdmin && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shop Configuration</h2>
          <div className="space-y-2">
            <Link
              to="/settings/panorama"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Image className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Panorama Management</p>
                  <p className="text-sm text-gray-500">Configure your shop's panorama view and hotspots</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
            </Link>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
            <p className="text-gray-900">{user?.firstName} {user?.lastName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
            <p className="text-gray-900">{user?.role}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Shop</label>
            <p className="text-gray-900">{user?.shop?.name}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Application</h2>
        <p className="text-gray-600">VisionDesk v1.0.0</p>
        <p className="text-gray-500 text-sm mt-1">Optician Management Platform</p>
      </div>
    </div>
  );
}
