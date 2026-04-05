import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Loader2, Truck } from 'lucide-react';
import api from '../../lib/api';
import { SupplierModal } from './SupplierModal';

export function SuppliersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fournisseurs</h1>
          <p className="text-slate-500 mt-1">Contacts et commandes fournisseurs</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un fournisseur
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : data?.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun fournisseur</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.map((supplier: { id: string; name: string; contact?: string; email?: string; phone?: string }) => (
              <div
                key={supplier.id}
                className="border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all bg-white"
              >
                <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                {supplier.contact && <p className="text-gray-600 text-sm mt-1">{supplier.contact}</p>}
                {supplier.email && <p className="text-gray-500 text-sm">{supplier.email}</p>}
                {supplier.phone && <p className="text-gray-500 text-sm">{supplier.phone}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <SupplierModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
