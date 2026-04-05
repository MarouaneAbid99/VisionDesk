import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  X,
  Users,
  ShoppingCart,
  Glasses,
  Eye,
  Loader2,
  Command,
} from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';

interface SearchResults {
  clients: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    client: { firstName: string; lastName: string };
  }>;
  frames: Array<{
    id: string;
    reference: string;
    model: string;
    brand: string;
    quantity: number;
  }>;
  lenses: Array<{
    id: string;
    name: string;
    type: string;
    supplier: string | null;
    quantity: number;
  }>;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (query.length < 2) return null;
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      return response.data.data as SearchResults;
    },
    enabled: query.length >= 2,
    staleTime: 1000,
  });

  // Flatten results for keyboard navigation
  const flatResults = results ? [
    ...results.clients.map(c => ({ type: 'client' as const, data: c })),
    ...results.orders.map(o => ({ type: 'order' as const, data: o })),
    ...results.frames.map(f => ({ type: 'frame' as const, data: f })),
    ...results.lenses.map(l => ({ type: 'lens' as const, data: l })),
  ] : [];

  const totalResults = flatResults.length;

  // Handle keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle navigation
  const handleSelect = useCallback((type: string, id: string) => {
    setIsOpen(false);
    switch (type) {
      case 'client':
        navigate(`/clients/${id}`);
        break;
      case 'order':
        navigate(`/orders/${id}`);
        break;
      case 'frame':
        navigate(`/stock/frames/${id}`);
        break;
      case 'lens':
        navigate(`/stock/lenses/${id}`);
        break;
    }
  }, [navigate]);

  // Handle keyboard navigation within results
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault();
      const item = flatResults[selectedIndex];
      handleSelect(item.type, item.data.id);
    }
  }, [flatResults, selectedIndex, totalResults, handleSelect]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'bg-green-100 text-green-700';
      case 'IN_ATELIER': return 'bg-amber-100 text-amber-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'DELIVERED': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-white rounded border border-gray-200">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center pt-[15vh] px-4">
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search clients, orders, frames, lenses..."
              className="flex-1 text-lg outline-none placeholder:text-gray-400"
            />
            {isLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query.length < 2 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <p>Type at least 2 characters to search</p>
                <p className="text-sm mt-2 text-gray-400">
                  Search across clients, orders, frames, and lenses
                </p>
              </div>
            ) : isLoading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Searching...</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <div className="py-2">
                {/* Clients */}
                {results?.clients && results.clients.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      Clients
                    </div>
                    {results.clients.map((client, idx) => {
                      const globalIdx = idx;
                      return (
                        <button
                          key={client.id}
                          onClick={() => handleSelect('client', client.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                            selectedIndex === globalIdx && "bg-primary-50"
                          )}
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {client.firstName} {client.lastName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {client.email || client.phone || 'No contact info'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Orders */}
                {results?.orders && results.orders.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      Orders
                    </div>
                    {results.orders.map((order, idx) => {
                      const globalIdx = (results?.clients?.length || 0) + idx;
                      return (
                        <button
                          key={order.id}
                          onClick={() => handleSelect('order', order.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                            selectedIndex === globalIdx && "bg-primary-50"
                          )}
                        >
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {order.orderNumber}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {order.client.firstName} {order.client.lastName}
                            </p>
                          </div>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", getStatusColor(order.status))}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Frames */}
                {results?.frames && results.frames.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      Frames
                    </div>
                    {results.frames.map((frame, idx) => {
                      const globalIdx = (results?.clients?.length || 0) + (results?.orders?.length || 0) + idx;
                      return (
                        <button
                          key={frame.id}
                          onClick={() => handleSelect('frame', frame.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                            selectedIndex === globalIdx && "bg-primary-50"
                          )}
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Glasses className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {frame.reference} - {frame.model}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {frame.brand} • {frame.quantity} in stock
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Lenses */}
                {results?.lenses && results.lenses.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      Lenses
                    </div>
                    {results.lenses.map((lens, idx) => {
                      const globalIdx = (results?.clients?.length || 0) + (results?.orders?.length || 0) + (results?.frames?.length || 0) + idx;
                      return (
                        <button
                          key={lens.id}
                          onClick={() => handleSelect('lens', lens.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                            selectedIndex === globalIdx && "bg-primary-50"
                          )}
                        >
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Eye className="w-5 h-5 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {lens.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {lens.type} {lens.supplier && `• ${lens.supplier}`} • {lens.quantity} in stock
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">Enter</kbd>
                to select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">Esc</kbd>
              to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
