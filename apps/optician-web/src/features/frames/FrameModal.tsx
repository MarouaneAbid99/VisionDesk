import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import api from '../../lib/api';

interface FrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  frameId?: string | null;
}

interface Brand {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

export function FrameModal({ isOpen, onClose, frameId }: FrameModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!frameId;

  const [formData, setFormData] = useState({
    brandId: '',
    supplierId: '',
    reference: '',
    model: '',
    color: '',
    size: '',
    material: '',
    quantity: 0,
    reorderLevel: 5,
    purchasePrice: 0,
    salePrice: 0,
    barcode: '',
  });

  const { data: existingFrame } = useQuery({
    queryKey: ['frame', frameId],
    queryFn: async () => {
      const response = await api.get(`/frames/${frameId}`);
      return response.data.data;
    },
    enabled: isEditing && isOpen,
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await api.get('/brands');
      return response.data.data;
    },
    enabled: isOpen,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data.data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (existingFrame) {
      setFormData({
        brandId: existingFrame.brandId || '',
        supplierId: existingFrame.supplierId || '',
        reference: existingFrame.reference || '',
        model: existingFrame.model || '',
        color: existingFrame.color || '',
        size: existingFrame.size || '',
        material: existingFrame.material || '',
        quantity: existingFrame.quantity || 0,
        reorderLevel: existingFrame.reorderLevel || 5,
        purchasePrice: Number(existingFrame.purchasePrice) || 0,
        salePrice: Number(existingFrame.salePrice) || 0,
        barcode: existingFrame.barcode || '',
      });
    } else if (!isEditing) {
      setFormData({
        brandId: '',
        supplierId: '',
        reference: '',
        model: '',
        color: '',
        size: '',
        material: '',
        quantity: 0,
        reorderLevel: 5,
        purchasePrice: 0,
        salePrice: 0,
        barcode: '',
      });
    }
  }, [existingFrame, isEditing, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/frames', {
        ...data,
        brandId: data.brandId || null,
        supplierId: data.supplierId || null,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frames'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.put(`/frames/${frameId}`, {
        ...data,
        brandId: data.brandId || null,
        supplierId: data.supplierId || null,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frames'] });
      queryClient.invalidateQueries({ queryKey: ['frame', frameId] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Frame' : 'Add Frame'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference *</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData((prev) => ({ ...prev, reference: e.target.value }))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData((prev) => ({ ...prev, brandId: e.target.value }))}
                className="input"
              >
                <option value="">Select brand</option>
                {brandsData?.brands?.map((brand: Brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
                className="input"
                placeholder="e.g., 52-18-140"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData((prev) => ({ ...prev, material: e.target.value }))}
                className="input"
                placeholder="e.g., Acetate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData((prev) => ({ ...prev, supplierId: e.target.value }))}
              className="input"
            >
              <option value="">Select supplier</option>
              {suppliersData?.suppliers?.map((supplier: Supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                className="input"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
              <input
                type="number"
                value={formData.salePrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, salePrice: Number(e.target.value) }))}
                className="input"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                className="input"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData((prev) => ({ ...prev, reorderLevel: Number(e.target.value) }))}
                className="input"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : isEditing ? (
                'Update Frame'
              ) : (
                'Add Frame'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
