import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null) return '—';
  const numAmount = Number(amount) || 0;
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'badge-gray',
    CONFIRMED: 'badge-primary',
    IN_ATELIER: 'badge-warning',
    READY: 'badge-success',
    READY_FOR_PICKUP: 'badge-success',
    PICKED_UP: 'badge-picked',
    DELIVERED: 'badge-delivered',
    CANCELLED: 'badge-danger',
  };
  return colors[status] || 'badge-gray';
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Brouillon',
    CONFIRMED: 'Confirmée',
    IN_ATELIER: 'En fabrication',
    READY: 'Prête',
    READY_FOR_PICKUP: 'Prête',
    PICKED_UP: 'Retirée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
  };
  return labels[status] || status;
}

export function getAtelierStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'badge-gray',
    IN_PROGRESS: 'badge-warning',
    READY: 'badge-success',
    BLOCKED: 'badge-danger',
  };
  return colors[status] || 'badge-gray';
}

export function getAtelierStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'En attente',
    IN_PROGRESS: 'En cours',
    READY: 'Prêt',
    BLOCKED: 'Bloqué',
  };
  return labels[status] || status.replace(/_/g, ' ');
}
