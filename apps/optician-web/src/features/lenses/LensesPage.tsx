import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Loader2, Circle, AlertTriangle, Edit2 } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { LensModal } from './LensModal';

export function LensesPage() {
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLensId, setEditingLensId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lenses', { search, lowStock }],
    queryFn: async () => {
      const response = await api.get('/lenses', { params: { search, lowStock, limit: 50 } });
      return response.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock verres</h1>
          <p className="text-slate-500 mt-1">Inventaire des verres</p>
        </div>
        <button 
          onClick={() => { setEditingLensId(null); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un verre
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un verre…"
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
        ) : data?.lenses?.length === 0 ? (
          <div className="text-center py-12">
            <Circle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun verre</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Nom</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Indice</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Traitement</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Qté</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Prix</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {data?.lenses?.map((lens: any) => (
                  <tr key={lens.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium text-gray-900">{lens.name}</td>
                    <td className="py-3 px-2 text-gray-600">{lens.lensType.replace('_', ' ')}</td>
                    <td className="py-3 px-2 text-gray-600">{lens.index || '-'}</td>
                    <td className="py-3 px-2 text-gray-600">{lens.coating.replace('_', ' ')}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className={lens.quantity <= lens.reorderLevel ? 'text-red-600 font-medium' : 'text-gray-900'}>
                          {lens.quantity}
                        </span>
                        {lens.quantity <= lens.reorderLevel && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-900">{formatCurrency(Number(lens.salePrice))}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => { setEditingLensId(lens.id); setIsModalOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Modifier le verre"
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

      <LensModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingLensId(null); }}
        lensId={editingLensId}
      />
    </div>
  );
}
