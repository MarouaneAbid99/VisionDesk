import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, User, FileText, Glasses, Circle, Calculator, Loader2, Sparkles, Star } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  prescriptions?: Prescription[];
}

interface Prescription {
  id: string;
  odSph: number | null;
  odCyl: number | null;
  odAxis: number | null;
  odAdd: number | null;
  osSph: number | null;
  osCyl: number | null;
  osAxis: number | null;
  osAdd: number | null;
  pdFar: number | null;
  createdAt: string;
}

interface Frame {
  id: string;
  reference: string;
  model: string | null;
  color: string | null;
  salePrice: number;
  quantity: number;
  brand?: { name: string };
}

interface Lens {
  id: string;
  name: string;
  lensType: string;
  coating: string;
  salePrice: number;
  quantity: number;
}

interface RecommendedLens {
  id: string;
  name: string;
  lensType: string;
  index: string | null;
  coating: string;
  salePrice: number;
  supplier: { id: string; name: string } | null;
  matchScore: number;
  matchReasons: string[];
}

const steps = [
  { id: 1, name: 'Client', icon: User },
  { id: 2, name: 'Prescription', icon: FileText },
  { id: 3, name: 'Frame', icon: Glasses },
  { id: 4, name: 'Lens', icon: Circle },
  { id: 5, name: 'Summary', icon: Calculator },
];

export function OrderBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    clientId: '',
    prescriptionId: '',
    frameId: '',
    lensId: '',
    framePrice: 0,
    lensPrice: 0,
    servicePrice: 0,
    discount: 0,
    deposit: 0,
    notes: '',
    dueDate: '',
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [selectedLens, setSelectedLens] = useState<Lens | null>(null);

  const { data: existingOrder } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingOrder) {
      setFormData({
        clientId: existingOrder.clientId,
        prescriptionId: existingOrder.prescriptionId || '',
        frameId: existingOrder.frameId || '',
        lensId: existingOrder.lensId || '',
        framePrice: Number(existingOrder.framePrice),
        lensPrice: Number(existingOrder.lensPrice),
        servicePrice: Number(existingOrder.servicePrice),
        discount: Number(existingOrder.discount),
        deposit: Number(existingOrder.deposit) || 0,
        notes: existingOrder.notes || '',
        dueDate: existingOrder.dueDate ? existingOrder.dueDate.split('T')[0] : '',
      });
      setSelectedClient(existingOrder.client);
      setSelectedFrame(existingOrder.frame);
      setSelectedLens(existingOrder.lens);
    }
  }, [existingOrder]);

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await api.get('/clients', { params: { limit: 100 } });
      return response.data.data;
    },
  });

  const { data: framesData } = useQuery({
    queryKey: ['frames-list'],
    queryFn: async () => {
      const response = await api.get('/frames', { params: { limit: 100 } });
      return response.data.data;
    },
  });

  const { data: lensesData } = useQuery({
    queryKey: ['lenses-list'],
    queryFn: async () => {
      const response = await api.get('/lenses', { params: { limit: 100 } });
      return response.data.data;
    },
  });

  const { data: prescriptionsData } = useQuery({
    queryKey: ['prescriptions', formData.clientId],
    queryFn: async () => {
      const response = await api.get('/prescriptions', { params: { clientId: formData.clientId } });
      return response.data.data;
    },
    enabled: !!formData.clientId,
  });

  const selectedPrescription = useMemo(() => {
    if (!formData.prescriptionId || !prescriptionsData?.prescriptions) return null;
    return prescriptionsData.prescriptions.find((rx: Prescription) => rx.id === formData.prescriptionId);
  }, [formData.prescriptionId, prescriptionsData]);

  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['lens-recommendations', selectedPrescription?.id],
    queryFn: async () => {
      const rx = selectedPrescription;
      const response = await api.post('/lenses/recommend', {
        sphere: rx?.odSph ?? rx?.osSph ?? undefined,
        cylinder: rx?.odCyl ?? rx?.osCyl ?? undefined,
        add: rx?.odAdd ?? rx?.osAdd ?? undefined,
      });
      return response.data.data;
    },
    enabled: !!selectedPrescription,
  });

  const totalPrice = useMemo(() => {
    return formData.framePrice + formData.lensPrice + formData.servicePrice - formData.discount;
  }, [formData.framePrice, formData.lensPrice, formData.servicePrice, formData.discount]);

  const remainingBalance = useMemo(() => {
    return totalPrice - formData.deposit;
  }, [totalPrice, formData.deposit]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/orders', {
        ...data,
        prescriptionId: data.prescriptionId || null,
        frameId: data.frameId || null,
        lensId: data.lensId || null,
        dueDate: data.dueDate || null,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/orders/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.put(`/orders/${id}`, {
        ...data,
        prescriptionId: data.prescriptionId || null,
        frameId: data.frameId || null,
        lensId: data.lensId || null,
        dueDate: data.dueDate || null,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      navigate(`/orders/${id}`);
    },
  });

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setFormData((prev) => ({ ...prev, clientId: client.id, prescriptionId: '' }));
  };

  const handleFrameSelect = (frame: Frame) => {
    setSelectedFrame(frame);
    setFormData((prev) => ({ ...prev, frameId: frame.id, framePrice: Number(frame.salePrice) }));
  };

  const handleLensSelect = (lens: Lens) => {
    setSelectedLens(lens);
    setFormData((prev) => ({ ...prev, lensId: lens.id, lensPrice: Number(lens.salePrice) }));
  };

  const handleSubmit = () => {
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!formData.clientId;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return !!formData.clientId;
      default: return true;
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Order' : 'New Order'}
          </h1>
          <p className="text-gray-500 mt-1">Build your optical order step by step</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                currentStep === step.id
                  ? 'bg-primary-100 text-primary-700'
                  : currentStep > step.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              <step.icon className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">{step.name}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={cn('w-8 h-0.5 mx-2', currentStep > step.id ? 'bg-green-300' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            {currentStep === 1 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Select Client</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {clientsData?.clients?.map((client: Client) => (
                    <div
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className={cn(
                        'p-4 border rounded-lg cursor-pointer transition-colors',
                        formData.clientId === client.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <p className="font-medium">{client.firstName} {client.lastName}</p>
                      {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Select Prescription (Optional)</h2>
                {!formData.clientId ? (
                  <p className="text-gray-500">Please select a client first</p>
                ) : prescriptionsData?.prescriptions?.length === 0 ? (
                  <p className="text-gray-500">No prescriptions found for this client</p>
                ) : (
                  <div className="space-y-2">
                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, prescriptionId: '' }))}
                      className={cn(
                        'p-4 border rounded-lg cursor-pointer transition-colors',
                        !formData.prescriptionId
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <p className="font-medium">No prescription</p>
                    </div>
                    {prescriptionsData?.prescriptions?.map((rx: Prescription) => (
                      <div
                        key={rx.id}
                        onClick={() => setFormData((prev) => ({ ...prev, prescriptionId: rx.id }))}
                        className={cn(
                          'p-4 border rounded-lg cursor-pointer transition-colors',
                          formData.prescriptionId === rx.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">OD: {rx.odSph ?? '-'} / {rx.odCyl ?? '-'} x {rx.odAxis ?? '-'}</p>
                            <p className="text-sm text-gray-600">OS: {rx.osSph ?? '-'} / {rx.osCyl ?? '-'} x {rx.osAxis ?? '-'}</p>
                          </div>
                          <p className="text-sm text-gray-500">PD: {rx.pdFar ?? '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Select Frame (Optional)</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div
                    onClick={() => { setSelectedFrame(null); setFormData((prev) => ({ ...prev, frameId: '', framePrice: 0 })); }}
                    className={cn(
                      'p-4 border rounded-lg cursor-pointer transition-colors',
                      !formData.frameId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <p className="font-medium">No frame</p>
                  </div>
                  {framesData?.frames?.map((frame: Frame) => (
                    <div
                      key={frame.id}
                      onClick={() => handleFrameSelect(frame)}
                      className={cn(
                        'p-4 border rounded-lg cursor-pointer transition-colors',
                        formData.frameId === frame.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{frame.brand?.name} {frame.reference}</p>
                          <p className="text-sm text-gray-500">{frame.model} - {frame.color}</p>
                          <p className="text-xs text-gray-400">Stock: {frame.quantity}</p>
                        </div>
                        <p className="font-semibold text-primary-600">{formatCurrency(Number(frame.salePrice))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Select Lens (Optional)</h2>
                
                {!selectedPrescription && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                    <p>💡 Select a prescription in step 2 to get personalized lens recommendations.</p>
                  </div>
                )}

                {selectedPrescription && recommendationsLoading && (
                  <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                      <span className="text-amber-700">Loading recommendations...</span>
                    </div>
                  </div>
                )}

                {selectedPrescription && !recommendationsLoading && recommendationsData?.recommendations?.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h3 className="font-medium text-amber-700">Recommended for this prescription</h3>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-amber-50 p-3 rounded-lg border border-amber-200">
                      {recommendationsData.recommendations.map((rec: RecommendedLens) => (
                          <div
                            key={rec.id}
                            onClick={() => handleLensSelect({ id: rec.id, name: rec.name, lensType: rec.lensType, coating: rec.coating, salePrice: rec.salePrice, quantity: 1 })}
                            className={cn(
                              'p-3 border rounded-lg cursor-pointer transition-colors bg-white',
                              formData.lensId === rec.id
                                ? 'border-amber-500 ring-2 ring-amber-200'
                                : 'border-amber-200 hover:border-amber-400'
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{rec.name}</p>
                                  <div className="flex items-center gap-1">
                                    {[...Array(Math.min(5, Math.floor(rec.matchScore / 20)))].map((_, i) => (
                                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500">{rec.lensType} - {rec.coating} {rec.index && `(${rec.index})`}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {rec.matchReasons.slice(0, 3).map((reason, i) => (
                                    <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <p className="font-semibold text-amber-600">{formatCurrency(rec.salePrice)}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <h3 className="font-medium text-gray-700 mb-2">All Lenses</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div
                    onClick={() => { setSelectedLens(null); setFormData((prev) => ({ ...prev, lensId: '', lensPrice: 0 })); }}
                    className={cn(
                      'p-4 border rounded-lg cursor-pointer transition-colors',
                      !formData.lensId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <p className="font-medium">No lens</p>
                  </div>
                  {lensesData?.lenses?.map((lens: Lens) => (
                    <div
                      key={lens.id}
                      onClick={() => handleLensSelect(lens)}
                      className={cn(
                        'p-4 border rounded-lg cursor-pointer transition-colors',
                        formData.lensId === lens.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{lens.name}</p>
                          <p className="text-sm text-gray-500">{lens.lensType} - {lens.coating}</p>
                          <p className="text-xs text-gray-400">Stock: {lens.quantity}</p>
                        </div>
                        <p className="font-semibold text-primary-600">{formatCurrency(Number(lens.salePrice))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Order Summary & Pricing</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Price</label>
                      <input
                        type="number"
                        value={formData.servicePrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, servicePrice: Number(e.target.value) }))}
                        className="input"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, discount: Number(e.target.value) }))}
                        className="input"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Paid</label>
                      <input
                        type="number"
                        value={formData.deposit}
                        onChange={(e) => setFormData((prev) => ({ ...prev, deposit: Number(e.target.value) }))}
                        className="input"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                        className="input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="input"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Client</span>
                <span className="font-medium">
                  {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Frame</span>
                <span className="font-medium">
                  {selectedFrame ? `${selectedFrame.brand?.name || ''} ${selectedFrame.reference}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lens</span>
                <span className="font-medium">{selectedLens?.name || '-'}</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between">
                <span className="text-gray-500">Frame Price</span>
                <span>{formatCurrency(formData.framePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lens Price</span>
                <span>{formatCurrency(formData.lensPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Service</span>
                <span>{formatCurrency(formData.servicePrice)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(formData.discount)}</span>
                </div>
              )}
              <hr className="my-3" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(totalPrice)}</span>
              </div>
              {formData.deposit > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Deposit</span>
                    <span className="text-green-600">-{formatCurrency(formData.deposit)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Balance Due</span>
                    <span>{formatCurrency(remainingBalance)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="btn-secondary flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </button>
              )}
              {currentStep < 5 ? (
                <button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  {isEditing ? 'Update Order' : 'Create Order'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
