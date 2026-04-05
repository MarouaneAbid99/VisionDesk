import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Loader2, Glasses, AlertTriangle, Edit2 } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { FrameModal } from './FrameModal';

export function FramesPage() {
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['frames', { search, lowStock }],
    queryFn: async () => {
      const response = await api.get('/frames', { params: { search, lowStock, limit: 50 } });
      return response.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock montures</h1>
          <p className="text-slate-500 mt-1">Inventaire des montures</p>
        </div>
        <button 
          onClick={() => { setEditingFrameId(null); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une monture
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une monture…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => setLowStock(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Stock faible uniquement</span>
          </label>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : data?.frames?.length === 0 ? (
          <div className="text-center py-12">
            <Glasses className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune monture</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Référence</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Marque</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Modèle</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Couleur</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Qté</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Prix</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {data?.frames?.map((frame: any) => (
                  <tr key={frame.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">{frame.reference}</td>
                    <td className="py-3 px-2 text-gray-600">{frame.brand?.name || '-'}</td>
                    <td className="py-3 px-2 text-gray-600">{frame.model || '-'}</td>
                    <td className="py-3 px-2 text-gray-600">{frame.color || '-'}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className={frame.quantity <= frame.reorderLevel ? 'text-red-600 font-medium' : 'text-gray-900'}>
                          {frame.quantity}
                        </span>
                        {frame.quantity <= frame.reorderLevel && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-900">{formatCurrency(Number(frame.salePrice))}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => { setEditingFrameId(frame.id); setIsModalOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Modifier la monture"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FrameModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingFrameId(null); }}
        frameId={editingFrameId}
      />
    </div>
  );
}
