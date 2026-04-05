import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { activityLogsService, shopsService } from '@/services';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  LoadingPage,
  EmptyState,
  Button,
} from '@/components/ui';

export function ActivityLogsPage() {
  const [shopFilter, setShopFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: shopsData } = useQuery({
    queryKey: ['shops', 'all'],
    queryFn: () => shopsService.findAll({ limit: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', { shopId: shopFilter, entityType: entityTypeFilter, page }],
    queryFn: () =>
      activityLogsService.findAll({
        shopId: shopFilter || undefined,
        entityType: entityTypeFilter || undefined,
        page,
        limit: 50,
      }),
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Activity Logs"
        description="View all platform activity across shops"
      />

      <Card>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select
              value={shopFilter}
              onChange={(e) => setShopFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Shops</option>
              {shopsData?.shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Entity Types</option>
              <option value="client">Client</option>
              <option value="order">Order</option>
              <option value="frame">Frame</option>
              <option value="lens">Lens</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Table */}
          {data?.logs && data.logs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Date/Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className="font-medium text-slate-900">{log.action}</span>
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <span>
                            {log.user.firstName} {log.user.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-400">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.shop ? (
                          <Link
                            to={`/shops/${log.shop.id}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {log.shop.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {log.entityType && (
                          <Badge variant="default">
                            {log.entityType}
                            {log.entityId && ` #${log.entityId.slice(0, 8)}`}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, data.pagination.total)} of{' '}
                    {data.pagination.total} logs
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
            <EmptyState title="No activity logs found" description="Activity will appear here as users interact with the platform" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
