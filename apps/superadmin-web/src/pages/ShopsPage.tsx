import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import { shopsService } from '@/services';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  LoadingPage,
  EmptyState,
} from '@/components/ui';
import { CreateShopModal } from '@/components/shops/CreateShopModal';

export function ShopsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['shops', { search, isActive: statusFilter, page }],
    queryFn: () => shopsService.findAll({ search, isActive: statusFilter, page, limit: 20 }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      shopsService.updateStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Shops"
        description="Manage all shops on the platform"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Shop
          </Button>
        }
      />

      <Card>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search shops..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'true' | 'false')}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Table */}
          {data?.shops && data.shops.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shop</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.shops.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell>
                        <Link
                          to={`/shops/${shop.id}`}
                          className="font-medium text-slate-900 hover:text-primary-600"
                        >
                          {shop.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {shop.email && <p>{shop.email}</p>}
                          {shop.phone && <p className="text-slate-500">{shop.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{shop._count?.users ?? 0}</TableCell>
                      <TableCell>{shop._count?.orders ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={shop.isActive ? 'success' : 'danger'}>
                          {shop.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(shop.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="relative group">
                          <button className="p-1 rounded hover:bg-slate-100">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover:block z-10">
                            <Link
                              to={`/shops/${shop.id}`}
                              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(shop.id, shop.isActive)}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              {shop.isActive ? (
                                <>
                                  <XCircle className="w-4 h-4 text-red-500" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  Activate
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.pagination.total)} of{' '}
                    {data.pagination.total} shops
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No shops found"
              description="Get started by creating your first shop"
              action={
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Shop
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <CreateShopModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
