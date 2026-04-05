import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Loader2, ShoppingCart, Wrench, Package, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, formatCurrency, getOrderStatusColor, getOrderStatusLabel, cn } from '../../lib/utils';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Toutes' },
  { value: 'DRAFT', label: 'Brouillons' },
  { value: 'CONFIRMED', label: 'À lancer' },
  { value: 'IN_ATELIER', label: 'En fabrication' },
  { value: 'READY', label: 'À remettre' },
  { value: 'COMPLETED', label: 'Terminées' },
  { value: 'PICKED_UP', label: 'Retirées' },
  { value: 'DELIVERED', label: 'Livrées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

function QuickStatusButton({ orderId, currentStatus, onSuccess }: { orderId: string; currentStatus: string; onSuccess: () => void }) {
  const mutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      return response.data.data;
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const getNextAction = () => {
    switch (currentStatus) {
      case 'CONFIRMED':
        return { status: 'IN_ATELIER', label: 'Envoyer en atelier', icon: Wrench, color: 'text-amber-700 hover:bg-amber-50' };
      case 'IN_ATELIER':
        return { status: 'READY', label: 'Marquer prête', icon: Package, color: 'text-green-700 hover:bg-green-50' };
      case 'READY':
        return { status: 'PICKED_UP', label: 'Marquer retirée', icon: CheckCircle, color: 'text-primary-700 hover:bg-primary-50' };
      case 'PICKED_UP':
        return { status: 'DELIVERED', label: 'Marquer livrée', icon: CheckCircle, color: 'text-violet-700 hover:bg-violet-50' };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();
  if (!nextAction) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        mutation.mutate(nextAction.status);
      }}
      disabled={mutation.isPending}
      className={cn(
        'p-1.5 rounded-xl transition-colors border border-transparent',
        nextAction.color,
        mutation.isPending && 'opacity-50'
      )}
      title={nextAction.label}
      type="button"
    >
      {mutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <nextAction.icon className="w-4 h-4" />
      )}
    </button>
  );
}

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const [search, setSearch] = useState('');
  const [page, _setPage] = useState(1);
  const queryClient = useQueryClient();

  const setStatus = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('status', value);
    else next.delete('status');
    setSearchParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { search, status, page }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      const response = await api.get('/orders', { params });
      return response.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commandes</h1>
          <p className="text-slate-500 mt-1">Suivi et traitement des commandes</p>
        </div>
        <Link to="/orders/new" className="btn-primary flex items-center justify-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Nouvelle commande
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une commande…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value || 'all'}
                type="button"
                onClick={() => setStatus(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  status === f.value
                    ? 'bg-primary-600 text-white border-primary-700 shadow-sm'
                    : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : data?.orders?.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune commande</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Commande</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Monture</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 w-14">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.orders?.map((order: { id: string; orderNumber: string; status: string; totalPrice: number; createdAt: string; client?: { firstName: string; lastName: string }; frame?: { reference?: string } }) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-3">
                      <Link to={`/orders/${order.id}`} className="text-primary-600 hover:text-primary-700 font-semibold">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-3 text-slate-900">
                      {order.client?.firstName} {order.client?.lastName}
                    </td>
                    <td className="py-4 px-3 text-slate-600">{order.frame?.reference || '—'}</td>
                    <td className="py-4 px-3">
                      <span className={`badge ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-slate-900 tabular-nums">{formatCurrency(Number(order.totalPrice))}</td>
                    <td className="py-4 px-3 text-slate-500 text-sm">{formatDate(order.createdAt)}</td>
                    <td className="py-4 px-3">
                      <QuickStatusButton
                        orderId={order.id}
                        currentStatus={order.status}
                        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
