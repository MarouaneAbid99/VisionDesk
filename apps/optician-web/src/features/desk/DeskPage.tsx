import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  CheckCircle,
  Wrench,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Plus,
  Users,
  Search,
  Glasses,
  Calendar,
  Clock,
  Phone,
  Package,
  AlertCircle,
  Eye,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import api from '../../lib/api';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getOrderStatusColor,
  getOrderStatusLabel,
  getAtelierStatusColor,
  getAtelierStatusLabel,
} from '../../lib/utils';

interface DeskSummary {
  ordersToday: number;
  ordersReady: number;
  ordersInAtelier: number;
  ordersPending: number;
  atelierWorkload: number;
  activeOrders: number;
  overdueOrders: number;
  urgentAtelierJobs: number;
  lowStockItems: number;
  appointmentsToday: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  client: { firstName: string; lastName: string };
}

interface Appointment {
  id: string;
  scheduledAt: string;
  type: string;
  status: string;
  notes: string | null;
  client: { id: string; firstName: string; lastName: string; phone: string | null };
}

interface ReadyOrder {
  id: string;
  orderNumber: string;
  updatedAt: string;
  client: { id: string; firstName: string; lastName: string; phone: string | null };
  frame: { reference: string; model: string } | null;
}

interface AtelierJob {
  id: string;
  status: string;
  priority: number;
  notes: string | null;
  createdAt: string;
  dueDate: string | null;
  order: {
    id: string;
    orderNumber: string;
    client: { firstName: string; lastName: string };
  };
  technician: { firstName: string; lastName: string } | null;
}

interface LowStockItem {
  id: string;
  reference?: string;
  model?: string;
  name?: string;
  quantity: number;
  reorderLevel: number;
  type: 'frame' | 'lens';
}

export function DeskPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['desk', 'summary'],
    queryFn: async () => {
      const response = await api.get('/desk/summary');
      return response.data.data as DeskSummary;
    },
    refetchInterval: 30000,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['desk', 'recent-orders'],
    queryFn: async () => {
      const response = await api.get('/desk/recent-orders?limit=5');
      return response.data.data as RecentOrder[];
    },
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['desk', 'today-appointments'],
    queryFn: async () => {
      const response = await api.get('/desk/today-appointments');
      return response.data.data as Appointment[];
    },
  });

  const { data: readyOrders, isLoading: readyLoading } = useQuery({
    queryKey: ['desk', 'ready-for-pickup'],
    queryFn: async () => {
      const response = await api.get('/desk/ready-for-pickup');
      return response.data.data as ReadyOrder[];
    },
  });

  const { data: atelierQueue, isLoading: atelierLoading } = useQuery({
    queryKey: ['desk', 'atelier-queue'],
    queryFn: async () => {
      const response = await api.get('/desk/atelier-queue');
      return response.data.data as AtelierJob[];
    },
  });

  const { data: lowStock, isLoading: lowStockLoading } = useQuery({
    queryKey: ['desk', 'low-stock'],
    queryFn: async () => {
      const response = await api.get('/desk/low-stock');
      return response.data.data as { frames: LowStockItem[]; lenses: LowStockItem[] };
    },
  });

  const { data: overdueOrders, isLoading: overdueLoading } = useQuery({
    queryKey: ['desk', 'overdue-orders'],
    queryFn: async () => {
      const response = await api.get('/desk/overdue-orders');
      return response.data.data as ReadyOrder[];
    },
  });

  const { data: delayedAtelier, isLoading: delayedAtelierLoading } = useQuery({
    queryKey: ['desk', 'delayed-atelier'],
    queryFn: async () => {
      const response = await api.get('/desk/delayed-atelier');
      return response.data.data as AtelierJob[];
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['desk', 'orders-analytics'],
    queryFn: async () => {
      const response = await api.get('/desk/orders-analytics');
      return response.data.data as {
        totalOrders: number;
        totalBookedRevenue: number;
        totalRevenue: number;
        ordersThisMonth: number;
        bookedRevenueThisMonth: number;
        bookedRevenueLastMonth: number;
        bookedRevenueToday: number;
        todayRevenue?: number;
        revenueThisMonth: number;
        averageOrderValue: number;
        monthOverMonthGrowth: string | null;
        bookedRevenueGrowth: string | null;
        revenueGrowth: string | null;
        collectedCashTotal: number;
        collectedCashThisMonth: number;
        collectedCashToday: number;
        completedRevenueTotal: number;
        completedRevenueThisMonth: number;
        completedRevenueToday: number;
      };
    },
  });

  const { data: bestSellers } = useQuery({
    queryKey: ['desk', 'best-sellers'],
    queryFn: async () => {
      const response = await api.get('/desk/best-sellers');
      return response.data.data as {
        frames: Array<{ id: string; reference: string; brand?: { name: string }; salesCount: number; revenue: number }>;
        lenses: Array<{ id: string; name: string; salesCount: number; revenue: number }>;
      };
    },
  });

  const { data: businessIntel } = useQuery({
    queryKey: ['desk', 'business-intelligence'],
    queryFn: async () => {
      const response = await api.get('/desk/business-intelligence');
      return response.data.data as {
        financial: {
          collectedCashToday: number;
          collectedCashThisMonth: number;
          bookedRevenueToday: number;
          bookedRevenueThisMonth?: number;
          completedTodayRevenue: number;
          ordersCompletedToday: number;
          cashToCollect: number;
          cashComing: number;
        };
      };
    },
  });

  const hasAlerts =
    (summary?.overdueOrders ?? 0) > 0 ||
    (summary?.urgentAtelierJobs ?? 0) > 0 ||
    (delayedAtelier?.length ?? 0) > 0;

  const kpiCards = [
    {
      name: 'Commandes aujourd’hui',
      value: summary?.ordersToday ?? 0,
      icon: ShoppingCart,
      color: 'bg-primary-600',
      href: '/orders',
    },
    {
      name: 'À remettre',
      value: summary?.ordersReady ?? 0,
      icon: CheckCircle,
      color: 'bg-green-600',
      href: '/orders?status=READY',
    },
    {
      name: 'En fabrication',
      value: summary?.ordersInAtelier ?? 0,
      icon: Wrench,
      color: 'bg-amber-500',
      href: '/orders?status=IN_ATELIER',
    },
    {
      name: 'Rendez-vous',
      value: summary?.appointmentsToday ?? 0,
      icon: Calendar,
      color: 'bg-violet-600',
      href: '/appointments',
    },
    {
      name: 'Stock faible',
      value: summary?.lowStockItems ?? 0,
      icon: AlertTriangle,
      color: summary?.lowStockItems ? 'bg-red-500' : 'bg-slate-400',
      href: '/stock/intelligence',
    },
  ];

  const quickActions = [
    { name: 'Nouvelle commande', icon: Plus, href: '/orders/new', color: 'bg-primary-600 hover:bg-primary-700' },
    { name: 'Nouveau client', icon: Users, href: '/clients/new', color: 'bg-primary-700 hover:bg-primary-800' },
    { name: 'Nouveau RDV', icon: Calendar, href: '/appointments?new=true', color: 'bg-violet-600 hover:bg-violet-700' },
    { name: 'Clients', icon: Search, href: '/clients', color: 'bg-slate-600 hover:bg-slate-700' },
    { name: 'Atelier', icon: Wrench, href: '/atelier', color: 'bg-amber-600 hover:bg-amber-700' },
    { name: 'Montures', icon: Glasses, href: '/stock/frames', color: 'bg-teal-600 hover:bg-teal-700' },
    { name: 'Verres', icon: Eye, href: '/stock/lenses', color: 'bg-cyan-600 hover:bg-cyan-700' },
    { name: 'Toutes les commandes', icon: ShoppingCart, href: '/orders', color: 'bg-green-600 hover:bg-green-700' },
  ];

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'EXAM':
        return 'bg-primary-100 text-primary-800 border border-primary-200/80';
      case 'FITTING':
        return 'bg-violet-100 text-violet-800 border border-violet-200/80';
      case 'PICKUP':
        return 'bg-green-100 text-green-800 border border-green-200/80';
      case 'CONSULTATION':
        return 'bg-amber-100 text-amber-900 border border-amber-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200/80';
    }
  };

  const appointmentTypeLabel = (type: string) => {
    const m: Record<string, string> = {
      EXAM: 'Examen',
      FITTING: 'Ajustage',
      PICKUP: 'Retrait',
      CONSULTATION: 'Consultation',
    };
    return m[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Tableau de bord
            <button
              onClick={() => refetchSummary()}
              className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              title="Actualiser"
              type="button"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </h1>
          <p className="text-slate-500 mt-1">Centre de contrôle — priorités et activité</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900 tabular-nums text-primary-700">
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-slate-500">
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>

      {/* Zone priorité */}
      {hasAlerts && (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50/80 p-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-red-900">À traiter en priorité</h3>
              <p className="text-xs text-red-800/80 mt-0.5">Actions urgentes sur les commandes ou l’atelier</p>
              <div className="mt-3 space-y-2">
                {(summary?.overdueOrders ?? 0) > 0 && (
                  <Link
                    to="/orders"
                    className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-red-100 hover:bg-white transition-colors group"
                  >
                    <span className="flex items-center gap-2 text-sm text-red-800 font-medium">
                      <Clock className="w-4 h-4 shrink-0" />
                      {summary?.overdueOrders} commande{(summary?.overdueOrders ?? 0) > 1 ? 's' : ''} en retard
                    </span>
                    <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}
                {(summary?.urgentAtelierJobs ?? 0) > 0 && (
                  <Link
                    to="/atelier"
                    className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-red-100 hover:bg-white transition-colors group"
                  >
                    <span className="flex items-center gap-2 text-sm text-red-800 font-medium">
                      <Wrench className="w-4 h-4 shrink-0" />
                      {summary?.urgentAtelierJobs} travail{(summary?.urgentAtelierJobs ?? 0) > 1 ? 'x' : ''} bloqué
                      {(summary?.urgentAtelierJobs ?? 0) > 1 ? 's' : ''} en atelier
                    </span>
                    <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}
                {(delayedAtelier?.length ?? 0) > 0 && (
                  <Link
                    to="/atelier"
                    className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-100 hover:bg-white transition-colors group"
                  >
                    <span className="flex items-center gap-2 text-sm text-amber-900 font-medium">
                      <Clock className="w-4 h-4 shrink-0" />
                      {delayedAtelier?.length} travail{(delayedAtelier?.length ?? 0) > 1 ? 'x' : ''} en retard
                    </span>
                    <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasAlerts && summary && (summary.ordersReady > 0 || summary.appointmentsToday > 0) && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50/60 p-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-primary-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-primary-900">Prochaines actions</h3>
              <div className="mt-2 space-y-2">
                {summary.ordersReady > 0 && (
                  <Link
                    to="/orders?status=READY"
                    className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-primary-100 hover:bg-white transition-colors group"
                  >
                    <span className="flex items-center gap-2 text-sm text-primary-900">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      {summary.ordersReady} commande{summary.ordersReady !== 1 ? 's' : ''} à remettre
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}
                {summary.appointmentsToday > 0 && (
                  <Link
                    to="/appointments"
                    className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-primary-100 hover:bg-white transition-colors group"
                  >
                    <span className="flex items-center gap-2 text-sm text-primary-900">
                      <Calendar className="w-4 h-4 text-violet-600 shrink-0" />
                      {summary.appointmentsToday} rendez-vous aujourd’hui
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Décisions commandes (aligné mobile) */}
      {summary && (
        <div className="card border-primary-100 bg-gradient-to-b from-primary-50/40 to-white">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Commandes</h2>
              <p className="text-xs text-slate-500 mt-1">
                {summary.activeOrders ?? 0} active{(summary.activeOrders ?? 0) !== 1 ? 's' : ''}
                {summary.ordersReady > 0 && (
                  <span className="text-green-700 font-semibold"> · {summary.ordersReady} à remettre</span>
                )}
              </p>
            </div>
            <Link to="/orders" className="text-sm font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              to="/orders?status=READY"
              className="rounded-2xl border-2 border-green-200 bg-green-50/80 p-4 hover:shadow-md transition-all"
            >
              <p className="text-2xl font-bold text-green-700 tabular-nums">{summary.ordersReady}</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">À remettre</p>
              <p className="text-xs text-slate-600 mt-0.5">Prêtes pour le client</p>
            </Link>
            <Link
              to="/orders?status=IN_ATELIER"
              className="rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-4 hover:shadow-md transition-all"
            >
              <p className="text-2xl font-bold text-amber-700 tabular-nums">{summary.ordersInAtelier}</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">En fabrication</p>
              <p className="text-xs text-slate-600 mt-0.5">En cours à l’atelier</p>
            </Link>
            <Link
              to="/orders?status=CONFIRMED"
              className="rounded-2xl border-2 border-primary-200 bg-primary-50/80 p-4 hover:shadow-md transition-all"
            >
              <p className="text-2xl font-bold text-primary-800 tabular-nums">{summary.ordersPending ?? 0}</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">À lancer</p>
              <p className="text-xs text-slate-600 mt-0.5">En attente d’atelier</p>
            </Link>
            <Link
              to="/orders?status=COMPLETED"
              className="rounded-2xl border-2 border-slate-200 bg-slate-50/90 p-4 hover:shadow-md transition-all"
            >
              <p className="text-2xl font-bold text-slate-700 tabular-nums">
                {businessIntel?.financial.ordersCompletedToday ?? 0}
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-1">Terminées</p>
              <p className="text-xs text-slate-600 mt-0.5">Aujourd’hui (retirées / livrées)</p>
            </Link>
          </div>
          <Link
            to="/orders/new"
            className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-primary-600 text-white py-3 text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle commande
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => (
          <Link
            key={kpi.name}
            to={kpi.href}
            className="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${kpi.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900">
                  {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : kpi.value}
                </p>
                <p className="text-xs text-gray-500 truncate">{kpi.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Vue propriétaire — chiffres clés */}
      {analytics && (
        <div className="card border-l-4 border-l-primary-600">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Vue propriétaire</h2>
            {(analytics.bookedRevenueGrowth ?? analytics.revenueGrowth) != null && (
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  Number(analytics.bookedRevenueGrowth ?? analytics.revenueGrowth) >= 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {Number(analytics.bookedRevenueGrowth ?? analytics.revenueGrowth) >= 0 ? '↑' : '↓'}{' '}
                {Math.abs(Number(analytics.bookedRevenueGrowth ?? analytics.revenueGrowth))}% CA réservé vs mois précédent
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-100 p-4">
              <p className="text-xs font-medium text-emerald-800 uppercase tracking-wide">CA réservé</p>
              <p className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
                {formatCurrency(
                  businessIntel?.financial.bookedRevenueToday ?? analytics.bookedRevenueToday ?? 0
                )}
              </p>
              <p className="text-xs text-emerald-700/80 mt-1">Aujourd’hui</p>
              <p className="text-sm font-semibold text-slate-800 mt-2 tabular-nums">
                {formatCurrency(analytics.bookedRevenueThisMonth ?? analytics.revenueThisMonth ?? 0)}
              </p>
              <p className="text-xs text-slate-600">Ce mois</p>
            </div>
            <div className="rounded-2xl bg-primary-50/80 border border-primary-100 p-4">
              <p className="text-xs font-medium text-primary-900 uppercase tracking-wide">Encaissé</p>
              <p className="text-xl font-bold text-primary-800 tabular-nums mt-1">
                {formatCurrency(businessIntel?.financial.collectedCashToday ?? analytics.collectedCashToday ?? 0)}
              </p>
              <p className="text-xs text-primary-800/80 mt-1">Aujourd’hui</p>
              <p className="text-sm font-semibold text-slate-800 mt-2 tabular-nums">
                {formatCurrency(analytics.collectedCashThisMonth ?? 0)}
              </p>
              <p className="text-xs text-slate-600">Ce mois</p>
            </div>
            <div className="rounded-2xl bg-violet-50/80 border border-violet-100 p-4">
              <p className="text-xs font-medium text-violet-900 uppercase tracking-wide">CA terminé</p>
              <p className="text-xl font-bold text-violet-800 tabular-nums mt-1">
                {formatCurrency(
                  businessIntel?.financial.completedTodayRevenue ?? analytics.completedRevenueToday ?? 0
                )}
              </p>
              <p className="text-xs text-violet-800/80 mt-1">Aujourd’hui</p>
              <p className="text-sm font-semibold text-slate-800 mt-2 tabular-nums">
                {formatCurrency(analytics.completedRevenueThisMonth ?? 0)}
              </p>
              <p className="text-xs text-slate-600">Ce mois</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Volume</p>
              <p className="text-xl font-bold text-slate-800 tabular-nums mt-1">{analytics.ordersThisMonth}</p>
              <p className="text-xs text-slate-500 mt-1">Commandes ce mois</p>
              {analytics.monthOverMonthGrowth != null && (
                <p
                  className={`text-xs font-semibold mt-2 ${
                    Number(analytics.monthOverMonthGrowth) >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {Number(analytics.monthOverMonthGrowth) >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(Number(analytics.monthOverMonthGrowth))}% vs mois dernier
                </p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                {analytics.totalOrders} commandes au total
              </p>
            </div>
          </div>
          {businessIntel && (businessIntel.financial.cashToCollect > 0 || businessIntel.financial.cashComing > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {businessIntel.financial.cashToCollect > 0 && (
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200"
                >
                  {formatCurrency(businessIntel.financial.cashToCollect)} reste à encaisser
                </Link>
              )}
              {businessIntel.financial.cashComing > 0 && (
                <Link
                  to="/orders?status=READY"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-900 border border-green-200"
                >
                  {formatCurrency(businessIntel.financial.cashComing)} à encaisser (prêtes)
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Accès rapide */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Accès rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className={`${action.color} text-white rounded-xl p-3 flex flex-col items-center gap-1.5 transition-colors text-center shadow-sm hover:shadow active:scale-[0.98]`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium leading-tight">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rendez-vous du jour */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-600" />
              Rendez-vous du jour
            </h2>
            <Link to="/appointments" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {appointmentsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : !todayAppointments?.length ? (
            <p className="text-center text-gray-500 py-6">Aucun rendez-vous aujourd’hui</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100/80">
                  <div className="text-center min-w-[50px]">
                    <p className="text-lg font-bold text-gray-900">{formatTime(apt.scheduledAt)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {apt.client.firstName} {apt.client.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getAppointmentTypeColor(apt.type)}`}>
                        {appointmentTypeLabel(apt.type)}
                      </span>
                      {apt.client.phone && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {apt.client.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commandes prêtes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              À remettre
            </h2>
            <Link to="/orders?status=READY" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {readyLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : !readyOrders?.length ? (
            <p className="text-center text-gray-500 py-6">Aucune commande prête</p>
          ) : (
            <div className="space-y-3">
              {readyOrders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100/90 transition-all shadow-sm"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {order.client.firstName} {order.client.lastName}
                      {order.frame && ` • ${order.frame.model}`}
                    </p>
                  </div>
                  {order.client.phone && (
                    <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                      <Phone className="w-3 h-3" />
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* File atelier */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-600" />
              File atelier
            </h2>
            <Link to="/atelier" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {atelierLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : !atelierQueue?.length ? (
            <p className="text-center text-gray-500 py-6">Aucun travail en file</p>
          ) : (
            <div className="space-y-3">
              {atelierQueue.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  to={`/orders/${job.order.id}`}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all shadow-sm ${
                    job.status === 'BLOCKED'
                      ? 'bg-red-50 border-red-100 hover:bg-red-100/80'
                      : 'bg-amber-50/80 border-amber-100 hover:bg-amber-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      job.status === 'BLOCKED' ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                  >
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{job.order.orderNumber}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {job.order.client.firstName} {job.order.client.lastName}
                      {job.technician && ` • ${job.technician.firstName}`}
                    </p>
                  </div>
                  <span className={`badge flex-shrink-0 ${getAtelierStatusColor(job.status)}`}>
                    {getAtelierStatusLabel(job.status)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alertes stock */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Stock faible
            </h2>
            <Link to="/stock/intelligence" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Détails <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {lowStockLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (!lowStock?.frames?.length && !lowStock?.lenses?.length) ? (
            <p className="text-center text-gray-500 py-6">Stock sous contrôle</p>
          ) : (
            <div className="space-y-3">
              {[...(lowStock?.frames || []).slice(0, 3), ...(lowStock?.lenses || []).slice(0, 2)].map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    {item.type === 'frame' ? <Glasses className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.type === 'frame' ? `${item.reference} - ${item.model}` : item.name}
                    </p>
                    <p className="text-sm text-red-700">
                      {item.quantity} restants (seuil {item.reorderLevel})
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold flex-shrink-0 border border-red-200/80">
                    {item.type === 'frame' ? 'Monture' : 'Verre'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Best Sellers */}
      {bestSellers && (bestSellers.frames?.length > 0 || bestSellers.lenses?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Frames */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Glasses className="w-5 h-5 text-primary-600" />
              Montures les plus vendues
            </h2>
            {bestSellers.frames?.length > 0 ? (
              <div className="space-y-3">
                {bestSellers.frames.slice(0, 5).map((frame, index) => (
                  <div key={frame.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {frame.brand?.name ? `${frame.brand.name} - ` : ''}{frame.reference}
                      </p>
                      <p className="text-sm text-gray-500">{frame.salesCount} vendues · {formatCurrency(frame.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Pas encore de données</p>
            )}
          </div>

          {/* Top Lenses */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-teal-600" />
              Verres les plus vendus
            </h2>
            {bestSellers.lenses?.length > 0 ? (
              <div className="space-y-3">
                {bestSellers.lenses.slice(0, 5).map((lens, index) => (
                  <div key={lens.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{lens.name}</p>
                      <p className="text-sm text-gray-500">{lens.salesCount} vendus · {formatCurrency(lens.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Pas encore de données</p>
            )}
          </div>
        </div>
      )}

      {/* Dernières commandes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary-600" />
            Dernière activité
          </h2>
          <Link to="/orders" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
            Tout voir <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {ordersLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : !recentOrders?.length ? (
          <p className="text-center text-gray-500 py-6">Aucune commande</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Commande</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="py-4 px-2">
                      <Link to={`/orders/${order.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-2 text-gray-900">
                      {order.client.firstName} {order.client.lastName}
                    </td>
                    <td className="py-4 px-2">
                      <span className={`badge ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-gray-900 tabular-nums">{formatCurrency(Number(order.totalPrice))}</td>
                    <td className="py-4 px-2 text-gray-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overdue Orders Section */}
      {(overdueOrders?.length ?? 0) > 0 && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              Commandes en retard
            </h2>
            <Link to="/orders" className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
              Voir commandes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {overdueLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-red-400" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {overdueOrders?.slice(0, 6).map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-red-600 truncate">
                      {order.client.firstName} {order.client.lastName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delayed Atelier Jobs Section */}
      {(delayedAtelier?.length ?? 0) > 0 && (
        <div className="card border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-600" />
              Atelier en retard
            </h2>
            <Link to="/atelier" className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
              Ouvrir atelier <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {delayedAtelierLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {delayedAtelier?.slice(0, 6).map((job) => (
                <Link
                  key={job.id}
                  to={`/orders/${job.order.id}`}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-300 transition-colors"
                >
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{job.order.orderNumber}</p>
                    <p className="text-sm text-orange-600 truncate">
                      {job.order.client.firstName} {job.order.client.lastName}
                    </p>
                    {job.dueDate && (
                      <p className="text-xs text-orange-500">
                        Échéance : {formatDate(job.dueDate)}
                      </p>
                    )}
                  </div>
                  <span className={`badge flex-shrink-0 ${getAtelierStatusColor(job.status)}`}>
                    {getAtelierStatusLabel(job.status)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
