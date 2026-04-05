import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Users, 
  ShoppingCart, 
  Glasses, 
  CircleDot,
  UserCheck,
  CheckCircle,
  XCircle,
  Image,
  ChevronRight
} from 'lucide-react';
import { shopsService } from '@/services';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  KPICard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  LoadingPage,
} from '@/components/ui';

export function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: shop, isLoading } = useQuery({
    queryKey: ['shops', id],
    queryFn: () => shopsService.findById(id!),
    enabled: !!id,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ isActive }: { isActive: boolean }) =>
      shopsService.updateStatus(id!, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops', id] });
    },
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!shop) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Shop not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/shops"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Shops
        </Link>
      </div>

      <PageHeader
        title={shop.name}
        description={shop.address || 'No address provided'}
        actions={
          <Button
            variant={shop.isActive ? 'danger' : 'primary'}
            onClick={() => toggleStatusMutation.mutate({ isActive: !shop.isActive })}
            isLoading={toggleStatusMutation.isPending}
          >
            {shop.isActive ? (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        }
      />

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="font-semibold text-slate-900">Quick Actions</h3>
        </CardHeader>
        <CardContent>
          <Link
            to={`/shops/${id}/panorama`}
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Image className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Panorama Management</p>
                <p className="text-sm text-slate-500">Configure shop's panorama view and hotspots</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
          </Link>
        </CardContent>
      </Card>

      {/* Shop Info */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <Badge variant={shop.isActive ? 'success' : 'danger'} className="mt-1">
                {shop.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{shop.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="font-medium text-slate-900">{shop.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Created</p>
              <p className="font-medium text-slate-900">
                {new Date(shop.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KPICard
          title="Users"
          value={shop._count?.users ?? 0}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Clients"
          value={shop._count?.clients ?? 0}
          icon={UserCheck}
          color="green"
        />
        <KPICard
          title="Orders"
          value={shop._count?.orders ?? 0}
          icon={ShoppingCart}
          color="purple"
        />
        <KPICard
          title="Frames"
          value={shop._count?.frames ?? 0}
          icon={Glasses}
          color="yellow"
        />
        <KPICard
          title="Lenses"
          value={shop._count?.lenses ?? 0}
          icon={CircleDot}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Shop Users</h3>
          </CardHeader>
          <CardContent className="p-0">
            {shop.users && shop.users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shop.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'success' : 'danger'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="px-6 py-4 text-sm text-slate-500">No users in this shop</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {shop.recentActivity && shop.recentActivity.length > 0 ? (
                shop.recentActivity.map((log) => (
                  <div key={log.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{log.action}</p>
                      <span className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.user && (
                      <p className="text-sm text-slate-500 mt-1">
                        {log.user.firstName} {log.user.lastName}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-6 py-4 text-sm text-slate-500">No activity yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
