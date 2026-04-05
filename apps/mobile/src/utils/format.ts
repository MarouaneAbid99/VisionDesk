export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return '—';
  const numAmount = Number(amount) || 0;
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const getInitials = (firstName: string | undefined, lastName: string | undefined): string => {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return `${first}${last}`.toUpperCase() || '?';
};

export const getFullName = (firstName: string | undefined, lastName: string | undefined): string => {
  return [firstName, lastName].filter(Boolean).join(' ') || '—';
};

export const getOrderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    DRAFT: 'Brouillon',
    CONFIRMED: 'Confirmée',
    IN_ATELIER: 'En atelier',
    READY: 'Prête',
    // Legacy alias (normalized to READY in DB)
    READY_FOR_PICKUP: 'Prête',
    PICKED_UP: 'Retirée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
  };
  return labels[status] || status;
};

export const getOrderStatusColor = (status: string): { bg: string; text: string } => {
  const colors: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: '#f1f5f9', text: '#64748b' },
    CONFIRMED: { bg: '#dbeafe', text: '#2563eb' },
    IN_ATELIER: { bg: '#fef3c7', text: '#d97706' },
    READY: { bg: '#dcfce7', text: '#16a34a' },
    READY_FOR_PICKUP: { bg: '#dcfce7', text: '#16a34a' },
    PICKED_UP: { bg: '#dbeafe', text: '#2563eb' },
    DELIVERED: { bg: '#dcfce7', text: '#16a34a' },
    CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
  };
  return colors[status] || { bg: '#f1f5f9', text: '#64748b' };
};
