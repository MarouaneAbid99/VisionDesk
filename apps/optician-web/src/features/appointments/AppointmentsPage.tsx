import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Loader2, Calendar, Clock, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, formatTime, cn } from '../../lib/utils';
import { AppointmentModal } from './AppointmentModal';

type AppointmentType = 'EYE_EXAM' | 'CONTACT_LENS' | 'PICKUP' | 'REPAIR' | 'OTHER';
type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

interface Appointment {
  id: string;
  clientId: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
  durationMinutes: number;
  notes: string | null;
  client: Client;
  createdAt: string;
}

const typeLabels: Record<AppointmentType, string> = {
  EYE_EXAM: 'Eye Exam',
  CONTACT_LENS: 'Contact Lens',
  PICKUP: 'Pickup',
  REPAIR: 'Repair',
  OTHER: 'Other',
};

const statusColors: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const typeColors: Record<AppointmentType, string> = {
  EYE_EXAM: 'bg-purple-100 text-purple-700',
  CONTACT_LENS: 'bg-cyan-100 text-cyan-700',
  PICKUP: 'bg-amber-100 text-amber-700',
  REPAIR: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<AppointmentType | ''>('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>();

  // Handle ?new=true query param to auto-open modal
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      const clientId = searchParams.get('clientId') || undefined;
      setPreselectedClientId(clientId);
      setIsModalOpen(true);
      setEditingAppointment(null);
      // Remove the query params after opening
      searchParams.delete('new');
      searchParams.delete('clientId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', { search, status: statusFilter, appointmentType: typeFilter, page }],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.appointmentType = typeFilter;
      const response = await api.get('/appointments', { params });
      return response.data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const response = await api.patch(`/appointments/${id}/status`, { status });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
    setPreselectedClientId(undefined);
  };

  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage client appointments and schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn('px-3 py-1.5 text-sm rounded-md transition-colors', viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600')}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn('px-3 py-1.5 text-sm rounded-md transition-colors', viewMode === 'calendar' ? 'bg-white shadow-sm' : 'text-gray-600')}
            >
              Calendar
            </button>
          </div>
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="card">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | '')}
              className="input w-auto"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as AppointmentType | '')}
              className="input w-auto"
            >
              <option value="">All Types</option>
              <option value="EYE_EXAM">Eye Exam</option>
              <option value="CONTACT_LENS">Contact Lens</option>
              <option value="PICKUP">Pickup</option>
              <option value="REPAIR">Repair</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : data?.appointments?.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No appointments found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Client</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Date & Time</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Duration</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.appointments?.map((apt: Appointment) => (
                      <tr key={apt.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-gray-900">{apt.client.firstName} {apt.client.lastName}</p>
                            {apt.client.phone && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {apt.client.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', typeColors[apt.appointmentType])}>
                            {typeLabels[apt.appointmentType]}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(apt.scheduledAt)}</span>
                            <Clock className="w-4 h-4 ml-2" />
                            <span>{formatTime(apt.scheduledAt)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-600">{apt.durationMinutes} min</td>
                        <td className="py-3 px-2">
                          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[apt.status])}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(apt)} className="text-primary-600 hover:text-primary-700 text-sm">
                              Edit
                            </button>
                            {apt.status === 'SCHEDULED' && (
                              <button
                                onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'CONFIRMED' })}
                                className="text-green-600 hover:text-green-700 text-sm"
                              >
                                Confirm
                              </button>
                            )}
                            {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                              <button
                                onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'COMPLETED' })}
                                className="text-gray-600 hover:text-gray-700 text-sm"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigateWeek(-1)} className="btn-secondary p-2">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => navigateWeek(1)} className="btn-secondary p-2">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {getWeekDays().map((day) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const dayAppointments = data?.appointments?.filter((apt: Appointment) => 
                new Date(apt.scheduledAt).toDateString() === day.toDateString()
              ) || [];
              return (
                <div key={day.toISOString()} className={cn('border rounded-lg p-2 min-h-[150px]', isToday && 'border-primary-500 bg-primary-50')}>
                  <p className={cn('text-sm font-medium mb-2', isToday ? 'text-primary-700' : 'text-gray-700')}>
                    {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                  </p>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt: Appointment) => (
                      <div
                        key={apt.id}
                        onClick={() => handleEdit(apt)}
                        className={cn('text-xs p-1 rounded cursor-pointer truncate', typeColors[apt.appointmentType])}
                      >
                        {formatTime(apt.scheduledAt)} - {apt.client.firstName}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <p className="text-xs text-gray-500">+{dayAppointments.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        appointment={editingAppointment}
        preselectedClientId={preselectedClientId}
      />
    </div>
  );
}
