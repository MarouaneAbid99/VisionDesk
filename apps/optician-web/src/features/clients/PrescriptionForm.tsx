import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../../lib/api';

interface PrescriptionFormProps {
  clientId: string;
  prescription?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function PrescriptionForm({ clientId, prescription, onClose, onSuccess }: PrescriptionFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!prescription;

  const [formData, setFormData] = useState({
    odSph: prescription?.odSph ?? '',
    odCyl: prescription?.odCyl ?? '',
    odAxis: prescription?.odAxis ?? '',
    odAdd: prescription?.odAdd ?? '',
    osSph: prescription?.osSph ?? '',
    osCyl: prescription?.osCyl ?? '',
    osAxis: prescription?.osAxis ?? '',
    osAdd: prescription?.osAdd ?? '',
    pdFar: prescription?.pdFar ?? '',
    pdNear: prescription?.pdNear ?? '',
    doctorName: prescription?.doctorName ?? '',
    notes: prescription?.notes ?? '',
    expiresAt: prescription?.expiresAt?.split('T')[0] ?? '',
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        clientId,
        odSph: data.odSph ? parseFloat(data.odSph) : null,
        odCyl: data.odCyl ? parseFloat(data.odCyl) : null,
        odAxis: data.odAxis ? parseInt(data.odAxis) : null,
        odAdd: data.odAdd ? parseFloat(data.odAdd) : null,
        osSph: data.osSph ? parseFloat(data.osSph) : null,
        osCyl: data.osCyl ? parseFloat(data.osCyl) : null,
        osAxis: data.osAxis ? parseInt(data.osAxis) : null,
        osAdd: data.osAdd ? parseFloat(data.osAdd) : null,
        pdFar: data.pdFar ? parseFloat(data.pdFar) : null,
        pdNear: data.pdNear ? parseFloat(data.pdNear) : null,
        doctorName: data.doctorName || null,
        notes: data.notes || null,
        expiresAt: data.expiresAt || null,
      };

      if (isEditing) {
        return api.put(`/prescriptions/${prescription.id}`, payload);
      }
      return api.post('/prescriptions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Prescription' : 'New Prescription'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Right Eye (OD) */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">OD</span>
              Right Eye
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sphere</label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.odSph}
                  onChange={(e) => handleChange('odSph', e.target.value)}
                  className="input text-sm"
                  placeholder="-3.00"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cylinder</label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.odCyl}
                  onChange={(e) => handleChange('odCyl', e.target.value)}
                  className="input text-sm"
                  placeholder="-1.50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Axis</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="180"
                  value={formData.odAxis}
                  onChange={(e) => handleChange('odAxis', e.target.value)}
                  className="input text-sm"
                  placeholder="90"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Add</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="4"
                  value={formData.odAdd}
                  onChange={(e) => handleChange('odAdd', e.target.value)}
                  className="input text-sm"
                  placeholder="2.00"
                />
              </div>
            </div>
          </div>

          {/* Left Eye (OS) */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">OS</span>
              Left Eye
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sphere</label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.osSph}
                  onChange={(e) => handleChange('osSph', e.target.value)}
                  className="input text-sm"
                  placeholder="-2.75"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cylinder</label>
                <input
                  type="number"
                  step="0.25"
                  value={formData.osCyl}
                  onChange={(e) => handleChange('osCyl', e.target.value)}
                  className="input text-sm"
                  placeholder="-1.25"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Axis</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="180"
                  value={formData.osAxis}
                  onChange={(e) => handleChange('osAxis', e.target.value)}
                  className="input text-sm"
                  placeholder="85"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Add</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="4"
                  value={formData.osAdd}
                  onChange={(e) => handleChange('osAdd', e.target.value)}
                  className="input text-sm"
                  placeholder="2.00"
                />
              </div>
            </div>
          </div>

          {/* PD */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Pupillary Distance</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">PD Far (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="40"
                  max="80"
                  value={formData.pdFar}
                  onChange={(e) => handleChange('pdFar', e.target.value)}
                  className="input text-sm"
                  placeholder="63"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">PD Near (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="40"
                  max="80"
                  value={formData.pdNear}
                  onChange={(e) => handleChange('pdNear', e.target.value)}
                  className="input text-sm"
                  placeholder="60"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Doctor Name</label>
              <input
                type="text"
                value={formData.doctorName}
                onChange={(e) => handleChange('doctorName', e.target.value)}
                className="input text-sm"
                placeholder="Dr. Smith"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expires</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => handleChange('expiresAt', e.target.value)}
                className="input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="input text-sm"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          {mutation.isError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              Failed to save prescription. Please try again.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEditing ? 'Update' : 'Save'} Prescription
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
