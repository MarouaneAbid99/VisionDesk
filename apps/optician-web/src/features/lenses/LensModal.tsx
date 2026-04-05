import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import api from '../../lib/api';

interface LensModalProps {
  isOpen: boolean;
  onClose: () => void;
  lensId?: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

const LENS_TYPES = [
  { value: 'SINGLE_VISION', label: 'Single Vision' },
  { value: 'BIFOCAL', label: 'Bifocal' },
  { value: 'PROGRESSIVE', label: 'Progressive' },
  { value: 'READING', label: 'Reading' },
  { value: 'SUNGLASSES', label: 'Sunglasses' },
];

const COATINGS = [
  { value: 'NONE', label: 'None' },
  { value: 'ANTI_REFLECTIVE', label: 'Anti-Reflective' },
  { value: 'BLUE_LIGHT', label: 'Blue Light' },
  { value: 'PHOTOCHROMIC', label: 'Photochromic' },
  { value: 'POLARIZED', label: 'Polarized' },
  { value: 'SCRATCH_RESISTANT', label: 'Scratch Resistant' },
];

export function LensModal({ isOpen, onClose, lensId }: LensModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!lensId;

  const [formData, setFormData] = useState({
    supplierId: '',
    name: '',
    lensType: 'SINGLE_VISION',
    index: '',
    coating: 'NONE',
    quantity: 0,
    reorderLevel: 5,
    purchasePrice: 0,
    salePrice: 0,
    barcode: '',
    minSphere: '',
    maxSphere: '',
    minCylinder: '',
    maxCylinder: '',
    maxAdd: '',
  });

  const { data: existingLens } = useQuery({
    queryKey: ['lens', lensId],
    queryFn: async () => {
      const response = await api.get(`/lenses/${lensId}`);
      return response.data.data;
    },
    enabled: isEditing && isOpen,
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
    if (existingLens) {
      setFormData({
        supplierId: existingLens.supplierId || '',
        name: existingLens.name || '',
        lensType: existingLens.lensType || 'SINGLE_VISION',
        index: existingLens.index || '',
        coating: existingLens.coating || 'NONE',
        quantity: existingLens.quantity || 0,
        reorderLevel: existingLens.reorderLevel || 5,
        purchasePrice: Number(existingLens.purchasePrice) || 0,
        salePrice: Number(existingLens.salePrice) || 0,
        barcode: existingLens.barcode || '',
        minSphere: existingLens.minSphere?.toString() || '',
        maxSphere: existingLens.maxSphere?.toString() || '',
        minCylinder: existingLens.minCylinder?.toString() || '',
        maxCylinder: existingLens.maxCylinder?.toString() || '',
        maxAdd: existingLens.maxAdd?.toString() || '',
      });
    } else if (!isEditing) {
      setFormData({
        supplierId: '',
        name: '',
        lensType: 'SINGLE_VISION',
        index: '',
        coating: 'NONE',
        quantity: 0,
        reorderLevel: 5,
        purchasePrice: 0,
        salePrice: 0,
        barcode: '',
        minSphere: '',
        maxSphere: '',
        minCylinder: '',
        maxCylinder: '',
        maxAdd: '',
      });
    }
  }, [existingLens, isEditing, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/lenses', {
        ...data,
        supplierId: data.supplierId || null,
        index: data.index || null,
        barcode: data.barcode || null,
        minSphere: data.minSphere ? Number(data.minSphere) : null,
        maxSphere: data.maxSphere ? Number(data.maxSphere) : null,
        minCylinder: data.minCylinder ? Number(data.minCylinder) : null,
        maxCylinder: data.maxCylinder ? Number(data.maxCylinder) : null,
        maxAdd: data.maxAdd ? Number(data.maxAdd) : null,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lenses'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.put(`/lenses/${lensId}`, {
        ...data,
        supplierId: data.supplierId || null,
        index: data.index || null,
        barcode: data.barcode || null,
        minSphere: data.minSphere ? Number(data.minSphere) : null,
        maxSphere: data.maxSphere ? Number(data.maxSphere) : null,
        minCylinder: data.minCylinder ? Number(data.minCylinder) : null,
        maxCylinder: data.maxCylinder ? Number(data.maxCylinder) : null,
        maxAdd: data.maxAdd ? Number(data.maxAdd) : null,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lenses'] });
      queryClient.invalidateQueries({ queryKey: ['lens', lensId] });
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
            {isEditing ? 'Edit Lens' : 'Add Lens'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lens Type</label>
              <select
                value={formData.lensType}
                onChange={(e) => setFormData((prev) => ({ ...prev, lensType: e.target.value }))}
                className="input"
              >
                {LENS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Index</label>
              <input
                type="text"
                value={formData.index}
                onChange={(e) => setFormData((prev) => ({ ...prev, index: e.target.value }))}
                className="input"
                placeholder="e.g., 1.67"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coating</label>
              <select
                value={formData.coating}
                onChange={(e) => setFormData((prev) => ({ ...prev, coating: e.target.value }))}
                className="input"
              >
                {COATINGS.map((coating) => (
                  <option key={coating.value} value={coating.value}>{coating.label}</option>
                ))}
              </select>
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

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Prescription Range (for recommendations)</h3>
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Sphere</label>
                <input
                  type="number"
                  value={formData.minSphere}
                  onChange={(e) => setFormData((prev) => ({ ...prev, minSphere: e.target.value }))}
                  className="input text-sm"
                  step="0.25"
                  placeholder="-10"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Sphere</label>
                <input
                  type="number"
                  value={formData.maxSphere}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxSphere: e.target.value }))}
                  className="input text-sm"
                  step="0.25"
                  placeholder="+10"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Cyl</label>
                <input
                  type="number"
                  value={formData.minCylinder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, minCylinder: e.target.value }))}
                  className="input text-sm"
                  step="0.25"
                  placeholder="-6"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Cyl</label>
                <input
                  type="number"
                  value={formData.maxCylinder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxCylinder: e.target.value }))}
                  className="input text-sm"
                  step="0.25"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Add</label>
                <input
                  type="number"
                  value={formData.maxAdd}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxAdd: e.target.value }))}
                  className="input text-sm"
                  step="0.25"
                  placeholder="3.5"
                />
              </div>
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
                'Update Lens'
              ) : (
                'Add Lens'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
