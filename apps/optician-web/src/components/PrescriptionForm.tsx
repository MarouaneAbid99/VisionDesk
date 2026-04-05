import { useState, useEffect } from 'react';
import { Copy, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface PrescriptionFormData {
  odSph: string;
  odCyl: string;
  odAxis: string;
  odAdd: string;
  osSph: string;
  osCyl: string;
  osAxis: string;
  osAdd: string;
  pdFar: string;
  pdNear: string;
  doctorName: string;
  notes: string;
  expiresAt: string;
}

interface PrescriptionFormProps {
  initialData?: Partial<PrescriptionFormData>;
  onChange: (data: PrescriptionFormData) => void;
  disabled?: boolean;
}

const SPHERE_OPTIONS = Array.from({ length: 51 }, (_, i) => (-25 + i * 0.25).toFixed(2));
const CYLINDER_OPTIONS = Array.from({ length: 41 }, (_, i) => (-10 + i * 0.25).toFixed(2));
const AXIS_OPTIONS = Array.from({ length: 181 }, (_, i) => i);
const ADD_OPTIONS = Array.from({ length: 17 }, (_, i) => (i * 0.25).toFixed(2));
const PD_OPTIONS = Array.from({ length: 31 }, (_, i) => (50 + i).toFixed(1));

export function PrescriptionForm({ initialData, onChange, disabled }: PrescriptionFormProps) {
  const [formData, setFormData] = useState<PrescriptionFormData>({
    odSph: initialData?.odSph || '',
    odCyl: initialData?.odCyl || '',
    odAxis: initialData?.odAxis || '',
    odAdd: initialData?.odAdd || '',
    osSph: initialData?.osSph || '',
    osCyl: initialData?.osCyl || '',
    osAxis: initialData?.osAxis || '',
    osAdd: initialData?.osAdd || '',
    pdFar: initialData?.pdFar || '',
    pdNear: initialData?.pdNear || '',
    doctorName: initialData?.doctorName || '',
    notes: initialData?.notes || '',
    expiresAt: initialData?.expiresAt || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PrescriptionFormData, string>>>({});

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const updateField = (field: keyof PrescriptionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const validateField = (field: keyof PrescriptionFormData, value: string) => {
    const newErrors = { ...errors };
    
    if (field === 'odSph' || field === 'osSph') {
      const num = parseFloat(value);
      if (value && (isNaN(num) || num < -25 || num > 25)) {
        newErrors[field] = 'Sphere must be between -25.00 and +25.00';
      } else {
        delete newErrors[field];
      }
    }
    
    if (field === 'odCyl' || field === 'osCyl') {
      const num = parseFloat(value);
      if (value && (isNaN(num) || num < -10 || num > 10)) {
        newErrors[field] = 'Cylinder must be between -10.00 and +10.00';
      } else {
        delete newErrors[field];
      }
    }
    
    if (field === 'odAxis' || field === 'osAxis') {
      const num = parseInt(value);
      if (value && (isNaN(num) || num < 0 || num > 180)) {
        newErrors[field] = 'Axis must be between 0 and 180';
      } else {
        delete newErrors[field];
      }
    }

    if (field === 'odAdd' || field === 'osAdd') {
      const num = parseFloat(value);
      if (value && (isNaN(num) || num < 0 || num > 4)) {
        newErrors[field] = 'Add must be between 0.00 and +4.00';
      } else {
        delete newErrors[field];
      }
    }
    
    setErrors(newErrors);
  };

  const copyOdToOs = () => {
    setFormData((prev) => ({
      ...prev,
      osSph: prev.odSph,
      osCyl: prev.odCyl,
      osAxis: prev.odAxis,
      osAdd: prev.odAdd,
    }));
  };

  const mirrorOdToOs = () => {
    setFormData((prev) => ({
      ...prev,
      osSph: prev.odSph,
      osCyl: prev.odCyl,
      osAxis: prev.odAxis ? String(180 - parseInt(prev.odAxis)) : '',
      osAdd: prev.odAdd,
    }));
  };

  const renderSelect = (
    field: keyof PrescriptionFormData,
    options: (string | number)[],
    placeholder: string
  ) => (
    <select
      value={formData[field]}
      onChange={(e) => updateField(field, e.target.value)}
      disabled={disabled}
      className={cn(
        'input text-center',
        errors[field] && 'border-red-500 focus:ring-red-500'
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {typeof opt === 'number' ? opt : (parseFloat(opt) >= 0 ? `+${opt}` : opt)}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-5 gap-2 mb-2">
          <div className="text-xs font-medium text-gray-500 text-center"></div>
          <div className="text-xs font-medium text-gray-500 text-center">SPH</div>
          <div className="text-xs font-medium text-gray-500 text-center">CYL</div>
          <div className="text-xs font-medium text-gray-500 text-center">AXIS</div>
          <div className="text-xs font-medium text-gray-500 text-center">ADD</div>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-3">
          <div className="flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">OD</span>
          </div>
          {renderSelect('odSph', SPHERE_OPTIONS, '0.00')}
          {renderSelect('odCyl', CYLINDER_OPTIONS, '0.00')}
          {renderSelect('odAxis', AXIS_OPTIONS, '0')}
          {renderSelect('odAdd', ADD_OPTIONS, '0.00')}
        </div>

        <div className="flex justify-center gap-2 mb-3">
          <button
            type="button"
            onClick={copyOdToOs}
            disabled={disabled}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            <Copy className="w-3 h-3" />
            Copy to OS
          </button>
          <button
            type="button"
            onClick={mirrorOdToOs}
            disabled={disabled}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
          >
            <ArrowRight className="w-3 h-3" />
            Mirror to OS
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          <div className="flex items-center justify-center">
            <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">OS</span>
          </div>
          {renderSelect('osSph', SPHERE_OPTIONS, '0.00')}
          {renderSelect('osCyl', CYLINDER_OPTIONS, '0.00')}
          {renderSelect('osAxis', AXIS_OPTIONS, '0')}
          {renderSelect('osAdd', ADD_OPTIONS, '0.00')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PD Far (mm)</label>
          {renderSelect('pdFar', PD_OPTIONS, 'Select')}
          {errors.pdFar && <p className="text-xs text-red-500 mt-1">{errors.pdFar}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PD Near (mm)</label>
          {renderSelect('pdNear', PD_OPTIONS, 'Select')}
          {errors.pdNear && <p className="text-xs text-red-500 mt-1">{errors.pdNear}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
          <input
            type="text"
            value={formData.doctorName}
            onChange={(e) => updateField('doctorName', e.target.value)}
            placeholder="Dr. Smith"
            disabled={disabled}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
          <input
            type="date"
            value={formData.expiresAt}
            onChange={(e) => updateField('expiresAt', e.target.value)}
            disabled={disabled}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Additional notes..."
          disabled={disabled}
          rows={2}
          className="input"
        />
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600 font-medium">Please fix the following errors:</p>
          <ul className="text-xs text-red-500 mt-1 list-disc list-inside">
            {Object.values(errors).map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
