import type { PrismaClient } from '@prisma/client';

const EPS = 0.01;

/** Minimal client shape for payment aggregate (works with transaction client). */
type PaymentClient = Pick<PrismaClient, 'payment'>;

/**
 * Sum of payment rows for an order (must match order.deposit when ledger is consistent).
 */
export async function sumPaymentsForOrder(db: PaymentClient, orderId: string): Promise<number> {
  const agg = await db.payment.aggregate({
    where: { orderId },
    _sum: { amount: true },
  });
  return Number(agg._sum.amount ?? 0);
}

/**
 * Logs when deposit and sum(payments) diverge (legacy data or manual edits).
 */
export function assertDepositMatchesLedger(
  orderId: string,
  deposit: number,
  sumPayments: number,
  context: string
): void {
  if (Math.abs(deposit - sumPayments) > EPS) {
    console.warn(
      `[payment-ledger] ${context} orderId=${orderId} deposit=${deposit.toFixed(2)} sum(payments)=${sumPayments.toFixed(2)}`
    );
  }
}
