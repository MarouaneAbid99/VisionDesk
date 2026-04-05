import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Loader2, User } from 'lucide-react';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', { search, page }],
    queryFn: async () => {
      const response = await api.get('/clients', { params: { search, page, limit: 20 } });
      return response.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Fichier clients et historique</p>
        </div>
        <Link to="/clients/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau client
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : data?.clients?.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun client</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Nom</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">E-mail</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Téléphone</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.clients?.map((client: Client) => (
                    <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <Link to={`/clients/${client.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                          {client.firstName} {client.lastName}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{client.email || '-'}</td>
                      <td className="py-3 px-2 text-gray-600">{client.phone || '-'}</td>
                      <td className="py-3 px-2 text-gray-500">{formatDate(client.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {data.pagination.page} sur {data.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.pagination.totalPages}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
