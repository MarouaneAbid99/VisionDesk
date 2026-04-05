/**
 * UNIFIED BUSINESS LOGIC - VisionDesk
 * =====================================
 * This file defines the SINGLE SOURCE OF TRUTH for all business logic
 * related to order statuses, categories, and operational metrics.
 * 
 * ALL components (API, Mobile, Web) MUST use these definitions.
 * DO NOT define status logic elsewhere.
 */

import { OrderStatus, AtelierJobStatus, PaymentStatus } from '@prisma/client';

// ============================================
// ORDER STATUS DEFINITIONS
// ============================================

/**
 * Order Status Flow:
 * DRAFT → CONFIRMED → IN_ATELIER → READY → PICKED_UP/DELIVERED
 *                                       ↘ CANCELLED (from any state)
 */

// ACTIVE ORDERS: Orders that represent current workload
// These are orders that need attention or are being processed
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'CONFIRMED',
  'IN_ATELIER',
  'READY',
];

// PENDING ORDERS: Orders waiting to enter the workflow
// These need confirmation or are waiting to be sent to atelier
export const PENDING_ORDER_STATUSES: OrderStatus[] = [
  'DRAFT',
  'CONFIRMED',
];

// ATELIER WORKLOAD: Orders currently in the atelier pipeline
// Only orders actively being worked on or waiting in atelier queue
export const ATELIER_ORDER_STATUSES: OrderStatus[] = [
  'CONFIRMED',  // Waiting to start in atelier
  'IN_ATELIER', // Currently being worked on
];

// READY FOR PICKUP: Orders completed and waiting for client
export const READY_ORDER_STATUSES: OrderStatus[] = [
  'READY',
];

// COMPLETED ORDERS: Orders that have been fulfilled
// These should NOT appear in active workload or "en cours" counts
export const COMPLETED_ORDER_STATUSES: OrderStatus[] = [
  'PICKED_UP',
  'DELIVERED',
];

// CLOSED ORDERS: Orders that are no longer active (completed or cancelled)
export const CLOSED_ORDER_STATUSES: OrderStatus[] = [
  'PICKED_UP',
  'DELIVERED',
  'CANCELLED',
];

// IN PROGRESS: Orders actively being processed (for "en cours" metric)
// Excludes DRAFT (not started) and COMPLETED/CANCELLED (finished)
export const IN_PROGRESS_ORDER_STATUSES: OrderStatus[] = [
  'CONFIRMED',
  'IN_ATELIER',
  'READY',
];

// ============================================
// ATELIER STATUS MAPPING
// ============================================

/**
 * Atelier status is DERIVED from Order status.
 * Order.status is the single source of truth.
 */
export const ORDER_TO_ATELIER_STATUS: Record<string, string> = {
  'CONFIRMED': 'PENDING',      // En attente
  'IN_ATELIER': 'IN_PROGRESS', // En cours
  'READY': 'READY',            // Prêt
};

export const ATELIER_TO_ORDER_STATUS: Record<string, string> = {
  'PENDING': 'CONFIRMED',
  'IN_PROGRESS': 'IN_ATELIER',
  'BLOCKED': 'IN_ATELIER',     // Blocked jobs are still in atelier
  'READY': 'READY',
};

// Orders visible in Atelier module (active atelier workload)
export const ATELIER_VISIBLE_ORDER_STATUSES: OrderStatus[] = [
  'CONFIRMED',
  'IN_ATELIER',
  'READY',
];

// ============================================
// DASHBOARD METRICS DEFINITIONS
// ============================================

export const DashboardMetrics = {
  /**
   * "En cours" - Active orders being processed
   * INCLUDES: CONFIRMED, IN_ATELIER, READY
   * EXCLUDES: DRAFT, PICKED_UP, DELIVERED, CANCELLED
   */
  activeOrders: IN_PROGRESS_ORDER_STATUSES,

  /**
   * "En attente" - Orders waiting for action
   * Orders confirmed but not yet in atelier
   */
  pendingOrders: ['CONFIRMED'] as OrderStatus[],

  /**
   * "En atelier" - Orders currently in workshop
   */
  inAtelierOrders: ['IN_ATELIER'] as OrderStatus[],

  /**
   * "Prêtes / À retirer" - Orders ready for client pickup
   */
  readyOrders: READY_ORDER_STATUSES,

  /**
   * "Atelier workload" - Total atelier queue
   * Orders that are in or waiting for atelier
   */
  atelierWorkload: ATELIER_ORDER_STATUSES,

  /**
   * Orders that should appear in "Recent Orders" on dashboard
   * Shows recent activity but excludes very old completed orders
   */
  recentOrdersStatuses: [
    'DRAFT',
    'CONFIRMED', 
    'IN_ATELIER',
    'READY',
    'PICKED_UP',
    'DELIVERED',
  ] as OrderStatus[],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function isActiveOrder(status: OrderStatus): boolean {
  return IN_PROGRESS_ORDER_STATUSES.includes(status);
}

export function isCompletedOrder(status: OrderStatus): boolean {
  return COMPLETED_ORDER_STATUSES.includes(status);
}

export function isClosedOrder(status: OrderStatus): boolean {
  return CLOSED_ORDER_STATUSES.includes(status);
}

export function isAtelierOrder(status: OrderStatus): boolean {
  return ATELIER_ORDER_STATUSES.includes(status);
}

export function isReadyOrder(status: OrderStatus): boolean {
  return READY_ORDER_STATUSES.includes(status);
}

export function getAtelierStatusFromOrder(orderStatus: OrderStatus): AtelierJobStatus | null {
  const status = ORDER_TO_ATELIER_STATUS[orderStatus];
  return status ? (status as AtelierJobStatus) : null;
}

export function getOrderStatusFromAtelier(atelierStatus: AtelierJobStatus): OrderStatus {
  return ATELIER_TO_ORDER_STATUS[atelierStatus] as OrderStatus;
}

// ============================================
// STATUS LABELS (French)
// ============================================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Brouillon',
  CONFIRMED: 'Confirmée',
  IN_ATELIER: 'En atelier',
  READY: 'Prête',
  // Legacy alias (should be normalized to READY in DB)
  READY_FOR_PICKUP: 'Prête',
  PICKED_UP: 'Retirée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export const ATELIER_STATUS_LABELS: Record<AtelierJobStatus, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  BLOCKED: 'Bloqué',
  READY: 'Prêt',
};

// ============================================
// PAYMENT STATUS DEFINITIONS
// ============================================

/**
 * Payment Status Flow:
 * UNPAID → PARTIAL (when deposit > 0) → PAID (when deposit >= totalPrice)
 */

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Non payée',
  PARTIAL: 'Acompte versé',
  PAID: 'Payée',
};

/**
 * Calculate payment status based on deposit and total price
 */
export function calculatePaymentStatus(deposit: number, totalPrice: number): PaymentStatus {
  if (totalPrice <= 0) return 'PAID';
  if (deposit <= 0) return 'UNPAID';
  if (deposit >= totalPrice) return 'PAID';
  return 'PARTIAL';
}

/**
 * Calculate remaining amount to collect
 */
export function calculateRemainingAmount(deposit: number, totalPrice: number): number {
  const remaining = totalPrice - deposit;
  return remaining > 0 ? remaining : 0;
}

/**
 * Check if order needs payment collection
 */
export function needsPaymentCollection(paymentStatus: PaymentStatus): boolean {
  return paymentStatus === 'UNPAID' || paymentStatus === 'PARTIAL';
}
