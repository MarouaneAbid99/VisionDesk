import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, Wrench, AlertTriangle, Clock, Calendar, Flag } from 'lucide-react';
import api from '../../lib/api';
import { formatDate, getAtelierStatusColor, getAtelierStatusLabel, cn } from '../../lib/utils';

interface AtelierJob {
  id: string;
  status: string;
  priority: number;
  dueDate: string | null;
  blockedReason: string | null;
  notes: string | null;
  technicianNotes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    client: { firstName: string; lastName: string };
    frame: { reference: string; model: string } | null;
    lens: { name: string } | null;
  };
  technician: { id: string; firstName: string; lastName: string } | null;
}

const priorityLabels: Record<number, { label: string; color: string }> = {
  0: { label: 'Normale', color: 'bg-slate-100 text-slate-700 border border-slate-200/80' },
  1: { label: 'Moyenne', color: 'bg-primary-50 text-primary-800 border border-primary-200/70' },
  2: { label: 'Haute', color: 'bg-amber-100 text-amber-900 border border-amber-200/80' },
  3: { label: 'Urgente', color: 'bg-red-100 text-red-800 border border-red-200/70' },
};

const getPriorityInfo = (priority: number) => {
  if (priority >= 3) return priorityLabels[3];
  if (priority >= 2) return priorityLabels[2];
  if (priority >= 1) return priorityLabels[1];
  return priorityLabels[0];
};

const isOverdue = (dueDate: string | null) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

export function AtelierPage() {
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'all' | 'grouped'>('grouped');

  const { data, isLoading } = useQuery({
    queryKey: ['atelier', 'jobs', { status }],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (status) params.status = status;
      const response = await api.get('/atelier/jobs', { params });
      return response.data.data;
    },
  });

  const jobs: AtelierJob[] = data?.jobs || [];

  const groupedJobs = {
    urgent: jobs.filter((j) => j.status !== 'READY' && (j.priority >= 2 || isOverdue(j.dueDate))),
    inProgress: jobs.filter((j) => j.status === 'IN_PROGRESS' && j.priority < 2 && !isOverdue(j.dueDate)),
    pending: jobs.filter((j) => j.status === 'PENDING' && j.priority < 2 && !isOverdue(j.dueDate)),
    ready: jobs.filter((j) => j.status === 'READY'),
  };

  const renderJobCard = (job: AtelierJob) => {
    const priorityInfo = getPriorityInfo(job.priority);
    const overdue = isOverdue(job.dueDate);

    const stepIndex = job.status === 'PENDING' ? 0 : job.status === 'IN_PROGRESS' ? 1 : job.status === 'READY' ? 2 : -1;

    return (
      <div
        key={job.id}
        className={cn(
          'border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all bg-white',
          job.status === 'BLOCKED' && 'border-red-300 bg-red-50',
          overdue && job.status !== 'READY' && 'border-amber-200 bg-amber-50/50',
          job.priority >= 3 && job.status !== 'READY' && 'ring-1 ring-primary-200'
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <Link to={`/orders/${job.order?.id}`} className="text-primary-600 hover:text-primary-700 font-semibold">
            {job.order?.orderNumber}
          </Link>
          <div className="flex items-center gap-1.5">
            {job.priority > 0 && (
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', priorityInfo.color)}>
                <Flag className="w-3 h-3 inline mr-0.5" />
                {priorityInfo.label}
              </span>
            )}
            <span className={cn('badge', getAtelierStatusColor(job.status))}>
              {getAtelierStatusLabel(job.status)}
            </span>
          </div>
        </div>

        {stepIndex >= 0 && (
          <div className="mb-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Parcours atelier</p>
            <div className="flex items-center justify-between gap-1">
              {(['En attente', 'En cours', 'Prêt'] as const).map((label, i) => (
                <div key={label} className="flex flex-col items-center flex-1 min-w-0">
                  <div
                    className={cn(
                      'h-2.5 w-2.5 rounded-full mb-1',
                      i < stepIndex && 'bg-green-500',
                      i === stepIndex && 'bg-primary-600 ring-2 ring-primary-200',
                      i > stepIndex && 'bg-slate-300'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-semibold text-center leading-tight',
                      i === stepIndex ? 'text-primary-800' : i < stepIndex ? 'text-green-800' : 'text-slate-400'
                    )}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-gray-900 font-medium">
          {job.order?.client?.firstName} {job.order?.client?.lastName}
        </p>

        {job.order?.frame && (
          <p className="text-gray-600 text-sm">{job.order.frame.reference}</p>
        )}

        {job.dueDate && (
          <div className={cn(
            "flex items-center gap-1 text-sm mt-2",
            overdue && job.status !== 'READY' ? "text-red-600 font-medium" : "text-gray-500"
          )}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Échéance: {formatDate(job.dueDate)}</span>
            {overdue && job.status !== 'READY' && <AlertTriangle className="w-3.5 h-3.5 ml-1" />}
          </div>
        )}

        {job.status === 'BLOCKED' && job.blockedReason && (
          <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            {job.blockedReason}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          {job.technician ? (
            <p className="text-gray-500 text-sm">
              {job.technician.firstName} {job.technician.lastName}
            </p>
          ) : (
            <p className="text-gray-400 text-sm italic">Non assigné</p>
          )}
          <p className="text-gray-400 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(job.createdAt)}
          </p>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, jobList: AtelierJob[], color: string, icon: React.ReactNode) => {
    if (jobList.length === 0) return null;
    return (
      <div className="mb-8">
        <div className={cn("flex items-center gap-2 mb-4 pb-2 border-b-2", color)}>
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="text-sm text-gray-500">({jobList.length})</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobList.map(renderJobCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atelier</h1>
          <p className="text-gray-500 mt-1">Gestion des travaux atelier</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('grouped')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors",
              view === 'grouped' ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            Groupé
          </button>
          <button
            onClick={() => setView('all')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-colors",
              view === 'all' ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            Tous
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input w-auto"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="READY">Prêt</option>
          </select>
          <div className="flex-1" />
          <div className="text-sm text-gray-500">
            {jobs.length} travaux
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun travail trouvé</p>
          </div>
        ) : view === 'grouped' ? (
          <div>
            {renderSection(
              "Urgents / En retard",
              groupedJobs.urgent,
              "border-amber-500",
              <Flag className="w-5 h-5 text-amber-500" />
            )}
            {renderSection(
              "En cours",
              groupedJobs.inProgress,
              "border-primary-500",
              <Wrench className="w-5 h-5 text-primary-600" />
            )}
            {renderSection(
              "En attente",
              groupedJobs.pending,
              "border-slate-400",
              <Clock className="w-5 h-5 text-slate-500" />
            )}
            {renderSection(
              "Prêts",
              groupedJobs.ready,
              "border-green-500",
              <Wrench className="w-5 h-5 text-green-500" />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(renderJobCard)}
          </div>
        )}
      </div>
    </div>
  );
}
