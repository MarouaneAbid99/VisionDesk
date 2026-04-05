import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, CheckCircle, Package, Truck, Wrench, XCircle, FileText, Printer } from 'lucide-react';
import api, { resolveApiUrl } from '../../lib/api';
import {
  formatCurrency,
  formatDateTime,
  getOrderStatusColor,
  getOrderStatusLabel,
  getAtelierStatusColor,
  getAtelierStatusLabel,
  cn,
} from '../../lib/utils';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await api.patch(`/orders/${id}/status`, { status });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const getQuickActions = () => {
    if (!order) return [];
    const actions: Array<{ status: string; label: string; icon: any; color: string }> = [];
    
    switch (order.status) {
      case 'DRAFT':
        actions.push({ status: 'CONFIRMED', label: 'Confirmer', icon: CheckCircle, color: 'bg-primary-600 hover:bg-primary-700' });
        break;
      case 'CONFIRMED':
        actions.push({ status: 'IN_ATELIER', label: 'Envoyer en atelier', icon: Wrench, color: 'bg-amber-600 hover:bg-amber-700' });
        break;
      case 'IN_ATELIER':
        actions.push({ status: 'READY', label: 'Marquer prête', icon: Package, color: 'bg-green-600 hover:bg-green-700' });
        break;
      case 'READY':
        actions.push({ status: 'PICKED_UP', label: 'Marquer retirée', icon: CheckCircle, color: 'bg-primary-600 hover:bg-primary-700' });
        break;
      case 'PICKED_UP':
        actions.push({ status: 'DELIVERED', label: 'Marquer livrée', icon: Truck, color: 'bg-violet-600 hover:bg-violet-700' });
        break;
    }
    
    if (order.status !== 'PICKED_UP' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
      actions.push({ status: 'CANCELLED', label: 'Annuler', icon: XCircle, color: 'bg-red-600 hover:bg-red-700' });
    }
    
    return actions;
  };

  const quickActions = getQuickActions();

  const openDocument = (type: 'pdf' | 'pickup-slip') => {
    const url = resolveApiUrl(`/documents/orders/${id}/${type}`);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-500">Commande introuvable</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-gray-500">Détail de la commande</p>
        </div>
        <span className={`badge ${getOrderStatusColor(order.status)}`}>
          {getOrderStatusLabel(order.status)}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openDocument('pdf')}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Order PDF"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => openDocument('pickup-slip')}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Pickup Slip"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Bon</span>
          </button>
        </div>
        {quickActions.length > 0 && (
          <div className="flex items-center gap-2">
            {quickActions.map((action) => (
              <button
                key={action.status}
                onClick={() => updateStatusMutation.mutate(action.status)}
                disabled={updateStatusMutation.isPending}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors",
                  action.color,
                  updateStatusMutation.isPending && "opacity-50 cursor-not-allowed"
                )}
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <action.icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client</h2>
          <Link to={`/clients/${order.client?.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
            {order.client?.firstName} {order.client?.lastName}
          </Link>
          {order.client?.phone && <p className="text-gray-600 mt-1">{order.client.phone}</p>}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarification</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Monture</span>
              <span>{formatCurrency(Number(order.framePrice))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Verres</span>
              <span>{formatCurrency(Number(order.lensPrice))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Prestation</span>
              <span>{formatCurrency(Number(order.servicePrice))}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Remise</span>
                <span>-{formatCurrency(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(Number(order.totalPrice))}</span>
            </div>
            {Number(order.deposit) > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Acompte versé</span>
                  <span>-{formatCurrency(Number(order.deposit))}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Reste à payer</span>
                  <span>{formatCurrency(Number(order.totalPrice) - Number(order.deposit))}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {order.frame && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monture</h2>
            <p className="font-medium">{order.frame.reference}</p>
            {order.frame.model && <p className="text-gray-600">{order.frame.model}</p>}
            {order.frame.brand && <p className="text-gray-500 text-sm">{order.frame.brand.name}</p>}
          </div>
        )}

        {order.lens && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Verre</h2>
            <p className="font-medium">{order.lens.name}</p>
            <p className="text-gray-600">{order.lens.lensType.replace('_', ' ')}</p>
          </div>
        )}

        {order.prescription && (
          <div className="card lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescription</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-2">Œil droit (OD)</p>
                <p className="text-gray-600">
                  SPH: {order.prescription.odSph || '-'} | CYL: {order.prescription.odCyl || '-'} | AXIS: {order.prescription.odAxis || '-'}
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Œil gauche (OS)</p>
                <p className="text-gray-600">
                  SPH: {order.prescription.osSph || '-'} | CYL: {order.prescription.osCyl || '-'} | AXIS: {order.prescription.osAxis || '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {order.atelierJob && (
          <div className="card lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Atelier</h2>
            <div className="flex items-center gap-4">
              <span className={`badge ${getAtelierStatusColor(order.atelierJob.status)}`}>
                {getAtelierStatusLabel(order.atelierJob.status)}
              </span>
              {order.atelierJob.technician && (
                <span className="text-gray-600">
                  Technicien : {order.atelierJob.technician.firstName} {order.atelierJob.technician.lastName}
                </span>
              )}
            </div>
            {order.atelierJob.notes && (
              <p className="mt-2 text-gray-600">{order.atelierJob.notes}</p>
            )}
          </div>
        )}

        {(order.readyAt || order.pickedUpAt || order.deliveredAt) && (
          <div className="card lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendrier</h2>
            <div className="flex flex-wrap gap-6">
              {order.readyAt && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Prête</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.readyAt)}</p>
                  </div>
                </div>
              )}
              {order.pickedUpAt && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-100 rounded-full">
                    <Package className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Retirée</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.pickedUpAt)}</p>
                  </div>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Truck className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Livrée</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.deliveredAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
