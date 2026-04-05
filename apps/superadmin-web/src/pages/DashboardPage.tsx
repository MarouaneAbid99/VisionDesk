import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Users, 
  ShoppingCart, 
  UserCheck,
  Glasses,
  CircleDot,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { dashboardService } from '@/services';
import { 
  PageHeader, 
  KPICard, 
  Card, 
  CardHeader, 
  CardContent,
  Badge,
  LoadingPage
} from '@/components/ui';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardService.getSummary,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  const stats = data?.stats;

  return (
    <div className="p-8">
      <PageHeader 
        title="Dashboard" 
        description="Platform overview and key metrics"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Shops"
          value={stats?.totalShops ?? 0}
          icon={Store}
          color="blue"
        />
        <KPICard
          title="Active Shops"
          value={stats?.activeShops ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="Inactive Shops"
          value={stats?.inactiveShops ?? 0}
          icon={XCircle}
          color="red"
        />
        <KPICard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Clients"
          value={stats?.totalClients ?? 0}
          icon={UserCheck}
          color="blue"
        />
        <KPICard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={ShoppingCart}
          color="green"
        />
        <KPICard
          title="Total Frames"
          value={stats?.totalFrames ?? 0}
          icon={Glasses}
          color="yellow"
        />
        <KPICard
          title="Total Lenses"
          value={stats?.totalLenses ?? 0}
          icon={CircleDot}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Shops */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent Shops</h3>
              <Link to="/shops" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {data?.recentShops?.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shops/${shop.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{shop.name}</p>
                    <p className="text-sm text-slate-500">
                      {shop._count?.users ?? 0} users · {shop._count?.orders ?? 0} orders
                    </p>
                  </div>
                  <Badge variant={shop.isActive ? 'success' : 'danger'}>
                    {shop.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Link>
              ))}
              {(!data?.recentShops || data.recentShops.length === 0) && (
                <p className="px-6 py-4 text-sm text-slate-500">No shops yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent Activity</h3>
              <Link to="/activity-logs" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {data?.recentActivity?.map((log) => (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{log.action}</p>
                    <span className="text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'} 
                    {log.shop && ` · ${log.shop.name}`}
                  </p>
                </div>
              ))}
              {(!data?.recentActivity || data.recentActivity.length === 0) && (
                <p className="px-6 py-4 text-sm text-slate-500">No activity yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
