import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';

type AppointmentType = 'EYE_EXAM' | 'CONTACT_LENS' | 'PICKUP' | 'REPAIR' | 'OTHER';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface Appointment {
  id: string;
  clientId: string;
  appointmentType: AppointmentType;
  scheduledAt: string;
  durationMinutes: number;
  notes: string | null;
  client: Client;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  preselectedClientId?: string;
}

interface FormData {
  clientId: string;
  appointmentType: AppointmentType;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  notes: string;
}

export function AppointmentModal({ isOpen, onClose, appointment, preselectedClientId }: AppointmentModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!appointment;

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const response = await api.get('/clients', { params: { limit: 100 } });
      return response.data.data;
    },
    enabled: isOpen,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      clientId: '',
      appointmentType: 'OTHER',
      scheduledDate: '',
      scheduledTime: '09:00',
      durationMinutes: 30,
      notes: '',
    },
  });

  useEffect(() => {
    if (appointment) {
      const date = new Date(appointment.scheduledAt);
      reset({
        clientId: appointment.clientId,
        appointmentType: appointment.appointmentType,
        scheduledDate: date.toISOString().split('T')[0],
        scheduledTime: date.toTimeString().slice(0, 5),
        durationMinutes: appointment.durationMinutes,
        notes: appointment.notes || '',
      });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      reset({
        clientId: preselectedClientId || '',
        appointmentType: 'OTHER',
        scheduledDate: tomorrow.toISOString().split('T')[0],
        scheduledTime: '09:00',
        durationMinutes: 30,
        notes: '',
      });
    }
  }, [appointment, reset, preselectedClientId]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString();
      const response = await api.post('/appointments', {
        clientId: data.clientId,
        appointmentType: data.appointmentType,
        scheduledAt,
        durationMinutes: data.durationMinutes,
        notes: data.notes || undefined,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create appointment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString();
      const response = await api.put(`/appointments/${appointment!.id}`, {
        clientId: data.clientId,
        appointmentType: data.appointmentType,
        scheduledAt,
        durationMinutes: data.durationMinutes,
        notes: data.notes || null,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update appointment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/appointments/${appointment!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete appointment');
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{isEditing ? 'Edit Appointment' : 'New Appointment'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select {...register('clientId', { required: 'Client is required' })} className="input">
              <option value="">Select a client</option>
              {clientsData?.clients?.map((client: Client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type *</label>
            <select {...register('appointmentType')} className="input">
              <option value="EYE_EXAM">Eye Exam</option>
              <option value="CONTACT_LENS">Contact Lens</option>
              <option value="PICKUP">Pickup</option>
              <option value="REPAIR">Repair</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                {...register('scheduledDate', { required: 'Date is required' })}
                className="input"
              />
              {errors.scheduledDate && <p className="text-red-500 text-sm mt-1">{errors.scheduledDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input
                type="time"
                {...register('scheduledTime', { required: 'Time is required' })}
                className="input"
              />
              {errors.scheduledTime && <p className="text-red-500 text-sm mt-1">{errors.scheduledTime.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <select {...register('durationMinutes', { valueAsNumber: true })} className="input">
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            {isEditing && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <div className={cn('flex gap-3', !isEditing && 'ml-auto')}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Appointment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
