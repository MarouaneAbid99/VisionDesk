import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type SupplierMetricsPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function periodDateFilter(period: SupplierMetricsPeriod): { gte: Date; lte: Date } | null {
  const now = new Date();
  const lte = now;
  let gte: Date;
  switch (period) {
    case 'today':
      gte = startOfDay(now);
      break;
    case 'week': {
      gte = new Date(now);
      gte.setDate(gte.getDate() - 7);
      break;
    }
    case 'month': {
      gte = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case 'year': {
      gte = new Date(now.getFullYear(), 0, 1);
      break;
    }
    case 'all':
    default:
      return null;
  }
  return { gte, lte };
}

/**
 * Revenue/cost attribution: frame line → frame's supplier; lens line → lens's supplier.
 * Cost uses current catalog purchasePrice (one unit per order line) — see limitation in API response.
 */
export const supplierBusinessService = {
  async getMetrics(supplierId: string, shopId: string, period: SupplierMetricsPeriod) {
    const range = periodDateFilter(period);
    const dateWhere: Prisma.DateTimeFilter | undefined = range
      ? { gte: range.gte, lte: range.lte }
      : undefined;

    const baseWhere: Prisma.OrderWhereInput = {
      shopId,
      ...(dateWhere ? { createdAt: dateWhere } : {}),
      OR: [{ frame: { supplierId } }, { lens: { supplierId } }],
    };

    const orders = await prisma.order.findMany({
      where: baseWhere,
      include: {
        frame: true,
        lens: true,
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let saleValue = 0;
    let purchaseCost = 0;
    let orderLines = 0;

    for (const o of orders) {
      if (o.frameId && o.frame?.supplierId === supplierId) {
        saleValue += Number(o.framePrice) || 0;
        purchaseCost += Number(o.frame?.purchasePrice) || 0;
        orderLines += 1;
      }
      if (o.lensId && o.lens?.supplierId === supplierId) {
        saleValue += Number(o.lensPrice) || 0;
        purchaseCost += Number(o.lens?.purchasePrice) || 0;
        orderLines += 1;
      }
    }

    const estimatedProfit = saleValue - purchaseCost;

    const recentSales = orders.slice(0, 12).map((o) => {
      const framePart =
        o.frameId && o.frame?.supplierId === supplierId
          ? { kind: 'frame' as const, amount: Number(o.framePrice) || 0, label: o.frame?.reference || 'Monture' }
          : null;
      const lensPart =
        o.lensId && o.lens?.supplierId === supplierId
          ? { kind: 'lens' as const, amount: Number(o.lensPrice) || 0, label: o.lens?.name || 'Verres' }
          : null;
      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        clientName: o.client ? `${o.client.firstName} ${o.client.lastName}`.trim() : null,
        parts: [framePart, lensPart].filter(Boolean),
      };
    });

    const stockIns = await prisma.stockMovement.findMany({
      where: {
        shopId,
        type: 'IN',
        ...(dateWhere ? { createdAt: dateWhere } : {}),
        OR: [{ frame: { supplierId } }, { lens: { supplierId } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        frame: { select: { reference: true, brand: { select: { name: true } } } },
        lens: { select: { name: true } },
      },
    });

    const recentStockIns = stockIns.map((m) => ({
      id: m.id,
      createdAt: m.createdAt,
      quantity: m.quantity,
      reason: m.reason,
      reference: m.reference,
      productLabel: m.frameId
        ? `${m.frame?.brand?.name || ''} ${m.frame?.reference || ''}`.trim()
        : m.lens?.name || '—',
      kind: m.frameId ? ('frame' as const) : ('lens' as const),
    }));

    return {
      period,
      ordersCount: orders.length,
      orderLinesAttributed: orderLines,
      saleValueTotal: saleValue,
      purchaseCostEstimated: purchaseCost,
      estimatedProfit,
      methodology: {
        revenue: 'Somme des montants facturés (monture et/ou verres) sur les commandes où l’article lié appartient à ce fournisseur.',
        cost: 'Somme des prix d’achat actuels sur la fiche article (un exemplaire par ligne commande). Pas d’historique d’achat au lot.',
        limitation:
          'Pas de table d’achats: le coût est une approximation basée sur le prix d’achat catalogue actuel, pas sur le prix réel à la date d’achat.',
      },
      recentSales,
      recentStockMovementsIn: recentStockIns,
    };
  },
};
