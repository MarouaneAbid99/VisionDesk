import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, TrendingDown, History, Loader2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';

interface LowStockItem {
  id: string;
  type: 'frame' | 'lens';
  name: string;
  details: string;
  currentStock: number;
  reorderLevel: number;
  suggestedQuantity: number;
  estimatedCost: number;
  supplierId: string | null;
  supplierName: string | null;
}

interface StockMovement {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string | null;
  createdAt: string;
  frame?: { reference: string; model: string | null };
  lens?: { name: string };
}

export function StockIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'reorder' | 'movements'>('alerts');

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['stock-summary'],
    queryFn: async () => {
      const response = await api.get('/stock/summary');
      return response.data.data;
    },
  });

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['stock-low'],
    queryFn: async () => {
      const response = await api.get('/stock/low-stock');
      return response.data.data;
    },
  });

  const { data: reorderData, isLoading: reorderLoading } = useQuery({
    queryKey: ['stock-reorder'],
    queryFn: async () => {
      const response = await api.get('/stock/reorder-suggestions');
      return response.data.data;
    },
  });

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const response = await api.get('/stock/movements', { params: { limit: 50 } });
      return response.data.data;
    },
  });

  const isLoading = summaryLoading || lowStockLoading || reorderLoading || movementsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Intelligence stock</h1>
        <p className="text-slate-500 mt-1">Niveaux, alertes et suggestions de réapprovisionnement</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Package className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{summaryData?.frames?.totalItems || 0}</p>
              <p className="text-sm text-slate-500">Références montures</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-xl border border-teal-100">
              <Package className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{summaryData?.lenses?.totalItems || 0}</p>
              <p className="text-sm text-slate-500">Références verres</p>
            </div>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{summaryData?.frames?.lowStock || 0}</p>
              <p className="text-sm text-amber-800">Montures sous seuil</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{summaryData?.lenses?.lowStock || 0}</p>
              <p className="text-sm text-red-800">Verres sous seuil</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex border-b border-gray-200 mb-4">
          {[
            { id: 'alerts', label: 'Alertes stock', icon: AlertTriangle },
            { id: 'reorder', label: 'Suggestions commande', icon: RefreshCw },
            { id: 'movements', label: 'Mouvements récents', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {activeTab === 'alerts' && (
              <div>
                {(!lowStockData?.frames?.length && !lowStockData?.lenses?.length) ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Niveaux de stock sous contrôle.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockData?.frames?.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-700 mb-2">Montures ({lowStockData.frames.length})</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">Article</th>
                                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">Fournisseur</th>
                                <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">Qté</th>
                                <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">Seuil</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lowStockData.frames.map((frame: any) => (
                                <tr key={frame.id} className="border-b border-gray-50">
                                  <td className="py-2 px-2">
                                    <p className="font-medium">{frame.brand?.name} {frame.reference}</p>
                                    <p className="text-sm text-gray-500">{frame.model} - {frame.color}</p>
                                  </td>
                                  <td className="py-2 px-2 text-gray-600">{frame.supplier?.name || '-'}</td>
                                  <td className="py-2 px-2 text-right">
                                    <span className={cn(
                                      'px-2 py-1 rounded text-sm font-medium',
                                      frame.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    )}>
                                      {frame.quantity}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-right text-gray-500">{frame.reorderLevel}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {lowStockData?.lenses?.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-700 mb-2">Verres ({lowStockData.lenses.length})</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">Article</th>
                                <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">Fournisseur</th>
                                <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">Qté</th>
                                <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">Seuil</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lowStockData.lenses.map((lens: any) => (
                                <tr key={lens.id} className="border-b border-gray-50">
                                  <td className="py-2 px-2">
                                    <p className="font-medium">{lens.name}</p>
                                    <p className="text-sm text-gray-500">{lens.lensType} - {lens.coating}</p>
                                  </td>
                                  <td className="py-2 px-2 text-gray-600">{lens.supplier?.name || '-'}</td>
                                  <td className="py-2 px-2 text-right">
                                    <span className={cn(
                                      'px-2 py-1 rounded text-sm font-medium',
                                      lens.quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    )}>
                                      {lens.quantity}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-right text-gray-500">{lens.reorderLevel}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reorder' && (
              <div>
                {!reorderData?.suggestions?.length ? (
                  <div className="text-center py-12 text-gray-500">
                    <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune suggestion de commande pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-primary-900">Total à réapprovisionner</p>
                          <p className="text-sm text-primary-800">
                            {reorderData.totalItems}{' '}
                            {reorderData.totalItems !== 1 ? 'articles' : 'article'} ·{' '}
                            {reorderData.bySupplier?.length || 0}{' '}
                            {(reorderData.bySupplier?.length || 0) !== 1 ? 'fournisseurs' : 'fournisseur'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-primary-800">Coût estimé</p>
                          <p className="text-xl font-bold text-primary-900">{formatCurrency(reorderData.totalEstimatedCost)}</p>
                        </div>
                      </div>
                    </div>

                    {reorderData.bySupplier?.map((supplier: any) => (
                      <div key={supplier.supplierId || 'unknown'} className="border rounded-lg">
                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                          <h4 className="font-medium">{supplier.supplierName}</h4>
                          <span className="text-sm text-gray-600">
                            {supplier.items.length} {supplier.items.length !== 1 ? 'articles' : 'article'} ·{' '}
                            {formatCurrency(supplier.totalEstimatedCost)}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Article</th>
                                <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Actuel</th>
                                <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Qté suggérée</th>
                                <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Coût est.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {supplier.items.map((item: LowStockItem) => (
                                <tr key={`${item.type}-${item.id}`} className="border-b border-gray-50">
                                  <td className="py-2 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        'px-1.5 py-0.5 rounded text-xs font-medium',
                                        item.type === 'frame' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                      )}>
                                        {item.type === 'frame' ? 'M' : 'V'}
                                      </span>
                                      <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-gray-500">{item.details}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2 px-4 text-right">
                                    <span className="text-red-600 font-medium">{item.currentStock}</span>
                                    <span className="text-gray-400"> / {item.reorderLevel}</span>
                                  </td>
                                  <td className="py-2 px-4 text-right font-medium text-green-600">
                                    +{item.suggestedQuantity}
                                  </td>
                                  <td className="py-2 px-4 text-right text-gray-600">
                                    {formatCurrency(item.estimatedCost)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'movements' && (
              <div>
                {!movementsData?.length ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun mouvement de stock récent.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">Date</th>
                          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">Article</th>
                          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">Sens</th>
                          <th className="text-right py-2 px-2 text-sm font-medium text-gray-500">Qté</th>
                          <th className="text-left py-2 px-2 text-sm font-medium text-gray-500">Motif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movementsData.map((movement: StockMovement) => (
                          <tr key={movement.id} className="border-b border-gray-50">
                            <td className="py-2 px-2 text-gray-500 text-sm">
                              {new Date(movement.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-2">
                              {movement.frame ? (
                                <span>{movement.frame.reference} {movement.frame.model}</span>
                              ) : movement.lens ? (
                                <span>{movement.lens.name}</span>
                              ) : '-'}
                            </td>
                            <td className="py-2 px-2">
                              <span className={cn(
                                'px-2 py-1 rounded text-xs font-medium',
                                movement.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              )}>
                                {movement.type === 'IN' ? 'Entrée' : 'Sortie'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right font-medium">
                              <span className={movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                                {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-gray-500">{movement.reason || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
