import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Mail, Phone, MapPin, Calendar, ShoppingCart, FileText, Clock, Eye, Plus, Edit, Pencil } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, formatCurrency, formatTime, getOrderStatusColor, getOrderStatusLabel, cn } from '../../lib/utils';
import { PrescriptionForm } from './PrescriptionForm';

const appointmentTypeLabels: Record<string, string> = {
  EYE_EXAM: 'Eye Exam',
  CONTACT_LENS: 'Contact Lens',
  PICKUP: 'Pickup',
  REPAIR: 'Repair',
  OTHER: 'Other',
};

const appointmentStatusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<any>(null);

  const { data: client, isLoading } = useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const response = await api.get(`/clients/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['client-appointments', id],
    queryFn: async () => {
      const response = await api.get('/appointments', { params: { clientId: id, limit: 10 } });
      return response.data.data;
    },
    enabled: !!id,
  });

  const totalOrders = client?.orders?.length || 0;
  const totalSpent = client?.orders?.reduce((sum: number, o: any) => sum + Number(o.totalPrice), 0) || 0;
  const lastVisit = client?.orders?.[0]?.createdAt || client?.appointments?.[0]?.scheduledAt;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-12 text-gray-500">Client not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/clients" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-gray-500">Client Profile</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/orders/new?clientId=${client.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Order</span>
          </Link>
          <Link
            to={`/appointments?new=true&clientId=${client.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">New Appointment</span>
          </Link>
          <Link
            to={`/clients/${client.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-primary-50 border-primary-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-700">{totalOrders}</p>
              <p className="text-sm text-primary-600">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-green-600">Total Spent</p>
            </div>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{client.prescriptions?.length || 0}</p>
              <p className="text-sm text-blue-600">Prescriptions</p>
            </div>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-amber-700">{lastVisit ? formatDate(lastVisit) : '-'}</p>
              <p className="text-sm text-amber-600">Last Visit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{client.address}</span>
              </div>
            )}
            {client.dateOfBirth && (
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(client.dateOfBirth)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Prescriptions</h2>
              <button
                onClick={() => {
                  setEditingPrescription(null);
                  setShowPrescriptionForm(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {client.prescriptions?.length === 0 ? (
              <p className="text-gray-500">No prescriptions</p>
            ) : (
              <div className="space-y-3">
                {client.prescriptions?.map((rx: any) => (
                  <div key={rx.id} className="p-3 bg-gray-50 rounded-lg group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-gray-500">{formatDate(rx.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        {rx.doctorName && <span className="text-sm text-gray-600">{rx.doctorName}</span>}
                        <button
                          onClick={() => {
                            setEditingPrescription(rx);
                            setShowPrescriptionForm(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">OD:</span> {rx.odSph || '-'} / {rx.odCyl || '-'} x {rx.odAxis || '-'}
                        {rx.odAdd && <span className="text-gray-500 ml-2">Add: +{rx.odAdd}</span>}
                      </div>
                      <div>
                        <span className="font-medium text-green-700">OS:</span> {rx.osSph || '-'} / {rx.osCyl || '-'} x {rx.osAxis || '-'}
                        {rx.osAdd && <span className="text-gray-500 ml-2">Add: +{rx.osAdd}</span>}
                      </div>
                    </div>
                    {(rx.pdFar || rx.pdNear) && (
                      <div className="text-sm text-gray-600 mt-2">
                        PD: {rx.pdFar && `Far ${rx.pdFar}mm`} {rx.pdNear && `Near ${rx.pdNear}mm`}
                      </div>
                    )}
                    {rx.expiresAt && (
                      <div className="text-xs text-amber-600 mt-2">
                        Expires: {formatDate(rx.expiresAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
            {client.orders?.length === 0 ? (
              <p className="text-gray-500">No orders</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Order</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Total</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.orders?.map((order: any) => (
                      <tr key={order.id} className="border-b border-gray-50">
                        <td className="py-2">
                          <Link to={`/orders/${order.id}`} className="text-primary-600 hover:text-primary-700">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-2">
                          <span className={`badge ${getOrderStatusColor(order.status)}`}>
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-2">{formatCurrency(Number(order.totalPrice))}</td>
                        <td className="py-2 text-gray-500">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointments</h2>
            {!appointmentsData?.appointments?.length ? (
              <p className="text-gray-500">No appointments</p>
            ) : (
              <div className="space-y-3">
                {appointmentsData.appointments.map((apt: any) => (
                  <div key={apt.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', appointmentStatusColors[apt.status])}>
                        {apt.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {appointmentTypeLabels[apt.appointmentType] || apt.appointmentType}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(apt.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(apt.scheduledAt)}</span>
                      </div>
                      <span>{apt.durationMinutes} min</span>
                    </div>
                    {apt.notes && <p className="text-sm text-gray-500 mt-2">{apt.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Form Modal */}
      {showPrescriptionForm && id && (
        <PrescriptionForm
          clientId={id}
          prescription={editingPrescription}
          onClose={() => {
            setShowPrescriptionForm(false);
            setEditingPrescription(null);
          }}
          onSuccess={() => {
            setShowPrescriptionForm(false);
            setEditingPrescription(null);
          }}
        />
      )}
    </div>
  );
}
