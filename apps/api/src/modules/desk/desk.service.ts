import { prisma } from '../../lib/prisma.js';
import {
  IN_PROGRESS_ORDER_STATUSES,
  READY_ORDER_STATUSES,
  ATELIER_ORDER_STATUSES,
  ATELIER_VISIBLE_ORDER_STATUSES,
  CLOSED_ORDER_STATUSES,
  DashboardMetrics,
} from '../../lib/businessLogic.js';

export const deskService = {
  /**
   * Get dashboard summary with CORRECT business logic counts
   * Uses unified status definitions from businessLogic.ts
   */
  async getSummary(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      // Orders created today (informational only)
      ordersToday,
      // ACTIVE orders = orders currently in progress (excludes DELIVERED, CANCELLED, PICKED_UP)
      activeOrders,
      // Orders ready for pickup (READY only - READY_FOR_PICKUP is legacy alias)
      ordersReady, 
      // Orders currently in atelier (IN_ATELIER only)
      ordersInAtelier,
      // Orders waiting to enter atelier (CONFIRMED only)
      ordersPending,
      // Atelier workload = CONFIRMED + IN_ATELIER
      atelierWorkload,
      // Overdue orders (active orders past due date)
      overdueOrders,
      lowStockFramesResult, 
      lowStockLensesResult, 
      appointmentsToday,
      // Blocked atelier jobs
      urgentAtelierJobs,
    ] = await Promise.all([
      // Orders created today
      prisma.order.count({
        where: { shopId, createdAt: { gte: today } },
      }),
      // ACTIVE orders (in progress, not completed/cancelled)
      prisma.order.count({
        where: {
          shopId,
          // READY_FOR_PICKUP is a legacy alias: treat it as READY for exact “Prêtes” semantics.
          status: { in: ['CONFIRMED', 'IN_ATELIER', 'READY', 'READY_FOR_PICKUP'] },
        },
      }),
      // Ready for pickup (READY only)
      prisma.order.count({
        where: {
          shopId,
          status: { in: ['READY', 'READY_FOR_PICKUP'] },
        },
      }),
      // Currently in atelier
      prisma.order.count({
        where: { shopId, status: 'IN_ATELIER' },
      }),
      // Pending (confirmed, waiting for atelier)
      prisma.order.count({
        where: { shopId, status: 'CONFIRMED' },
      }),
      // Total atelier workload (confirmed + in_atelier)
      prisma.order.count({
        where: { shopId, status: { in: ATELIER_ORDER_STATUSES } },
      }),
      // Overdue active orders
      prisma.order.count({
        where: { 
          shopId, 
          status: { in: ATELIER_ORDER_STATUSES },
          dueDate: { lt: today },
        },
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM frames 
        WHERE shop_id = ${shopId} AND is_active = true AND quantity <= reorder_level
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM lenses 
        WHERE shop_id = ${shopId} AND is_active = true AND quantity <= reorder_level
      `,
      prisma.appointment.count({
        where: { 
          shopId, 
          scheduledAt: { gte: today, lt: tomorrow },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      prisma.atelierJob.count({
        where: {
          shopId,
          status: 'BLOCKED',
        },
      }),
    ]);

    const lowStockFrames = Number(lowStockFramesResult[0].count);
    const lowStockLenses = Number(lowStockLensesResult[0].count);

    return {
      // Informational
      ordersToday,
      // KEY METRICS - using correct business logic
      activeOrders,        // "En cours" - total active orders
      ordersReady,         // "Prêtes" - ready for pickup
      ordersInAtelier,     // "En atelier" - currently being worked on
      ordersPending,       // "En attente" - confirmed, waiting for atelier
      atelierWorkload,     // Total atelier queue (pending + in_atelier)
      overdueOrders,       // Overdue orders needing attention
      urgentAtelierJobs,   // Blocked jobs
      // Stock
      lowStockItems: lowStockFrames + lowStockLenses,
      lowStockFrames,
      lowStockLenses,
      // Appointments
      appointmentsToday,
    };
  },

  /**
   * Get recent orders - excludes CANCELLED orders from recent activity
   * Shows meaningful recent activity, not noise
   */
  async getRecentOrders(shopId: string, limit = 10) {
    const orders = await prisma.order.findMany({
      where: { 
        shopId,
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        frame: { select: { reference: true, model: true } },
        lens: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Treat legacy READY_FOR_PICKUP as READY everywhere in the UI.
    return orders.map((o) => ({
      ...o,
      status: o.status === 'READY_FOR_PICKUP' ? 'READY' : o.status,
    }));
  },

  async getLowStock(shopId: string) {
    const [frames, lenses] = await Promise.all([
      prisma.$queryRaw`
        SELECT id, reference, model, quantity, reorder_level as reorderLevel, 'frame' as type
        FROM frames
        WHERE shop_id = ${shopId} AND is_active = true AND quantity <= reorder_level
        ORDER BY quantity ASC
        LIMIT 20
      `,
      prisma.$queryRaw`
        SELECT id, name, quantity, reorder_level as reorderLevel, 'lens' as type
        FROM lenses
        WHERE shop_id = ${shopId} AND is_active = true AND quantity <= reorder_level
        ORDER BY quantity ASC
        LIMIT 20
      `,
    ]);

    return { frames, lenses };
  },

  /**
   * Get atelier queue - ONLY active atelier orders
   * Filters by ORDER status (source of truth), not AtelierJob status
   */
  async getAtelierQueue(shopId: string) {
    return prisma.atelierJob.findMany({
      where: {
        shopId,
        order: {
          status: { in: [...ATELIER_VISIBLE_ORDER_STATUSES, 'READY_FOR_PICKUP' as any] },
        },
      },
      include: {
        order: {
          include: {
            client: { select: { firstName: true, lastName: true } },
          },
        },
        technician: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: 20,
    });
  },

  async getUpcomingAppointments(shopId: string, limit = 5) {
    const now = new Date();
    return prisma.appointment.findMany({
      where: {
        shopId,
        scheduledAt: { gte: now },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });
  },

  async getTodayAppointments(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.appointment.findMany({
      where: {
        shopId,
        scheduledAt: { gte: today, lt: tomorrow },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  },

  /**
   * Get orders ready for pickup - READY only (READY_FOR_PICKUP is legacy alias)
   */
  async getReadyForPickup(shopId: string) {
    const orders = await prisma.order.findMany({
      where: {
        shopId,
        status: { in: ['READY', 'READY_FOR_PICKUP'] },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        frame: { select: { reference: true, model: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return orders.map((o) => ({
      ...o,
      status: o.status === 'READY_FOR_PICKUP' ? 'READY' : o.status,
    }));
  },

  /**
   * Get overdue orders - only ACTIVE orders that are past due
   */
  async getOverdueOrders(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.order.findMany({
      where: {
        shopId,
        status: { in: ATELIER_ORDER_STATUSES },
        dueDate: { lt: today },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        frame: { select: { reference: true, model: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });
  },

  /**
   * Get delayed atelier jobs - filters by ORDER status (source of truth)
   */
  async getDelayedAtelierJobs(shopId: string) {
    const now = new Date();

    return prisma.atelierJob.findMany({
      where: {
        shopId,
        order: {
          status: { in: [...ATELIER_VISIBLE_ORDER_STATUSES, 'READY_FOR_PICKUP' as any] },
        },
        dueDate: { lt: now },
      },
      include: {
        order: {
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        technician: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });
  },

  async getOrdersAnalytics(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const thisMonthEndExclusive = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
      totalOrders,
      totalBookedRevenue,
      ordersThisMonth,
      bookedRevenueThisMonth,
      ordersLastMonth,
      bookedRevenueLastMonth,
      ordersByStatus,
      averageOrderValue,
      bookedRevenueTodayResult,
      // Collected cash is based on actual payment records.
      collectedCashTotal,
      collectedCashThisMonth,
      collectedCashToday,
      // Completed revenue is recognized on completed orders only.
      completedRevenueTotal,
      completedRevenueThisMonth,
      completedRevenueToday,
    ] = await Promise.all([
      prisma.order.count({ where: { shopId } }),
      prisma.order.aggregate({
        where: { shopId, status: { notIn: ['CANCELLED'] } },
        _sum: { totalPrice: true },
      }),
      prisma.order.count({
        where: { shopId, createdAt: { gte: thisMonth } },
      }),
      prisma.order.aggregate({
        where: { shopId, createdAt: { gte: thisMonth }, status: { notIn: ['CANCELLED'] } },
        _sum: { totalPrice: true },
      }),
      prisma.order.count({
        where: { shopId, createdAt: { gte: lastMonth, lt: thisMonth } },
      }),
      prisma.order.aggregate({
        where: { shopId, createdAt: { gte: lastMonth, lt: thisMonth }, status: { notIn: ['CANCELLED'] } },
        _sum: { totalPrice: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { shopId },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { shopId, status: { notIn: ['CANCELLED'] } },
        _avg: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: { shopId, createdAt: { gte: today, lt: tomorrow }, status: { notIn: ['CANCELLED'] } },
        _sum: { totalPrice: true },
      }),
      prisma.payment.aggregate({
        where: { shopId },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { shopId, createdAt: { gte: thisMonth, lt: thisMonthEndExclusive } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { shopId, createdAt: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: { shopId, status: { in: ['PICKED_UP', 'DELIVERED'] } },
        _sum: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: {
          shopId,
          status: { in: ['PICKED_UP', 'DELIVERED'] },
          updatedAt: { gte: thisMonth, lt: thisMonthEndExclusive },
        },
        _sum: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: {
          shopId,
          status: { in: ['PICKED_UP', 'DELIVERED'] },
          updatedAt: { gte: today, lt: tomorrow },
        },
        _sum: { totalPrice: true },
      }),
    ]);

    const statusCounts = ordersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const bookedThisMonthValue = Number(bookedRevenueThisMonth._sum.totalPrice || 0);
    const bookedLastMonthValue = Number(bookedRevenueLastMonth._sum.totalPrice || 0);

    return {
      totalOrders,
      // Booked revenue semantics (order value, excluding cancelled)
      totalBookedRevenue: Number(totalBookedRevenue._sum.totalPrice || 0),
      ordersThisMonth,
      bookedRevenueThisMonth: bookedThisMonthValue,
      ordersLastMonth,
      bookedRevenueLastMonth: bookedLastMonthValue,
      averageOrderValue: Number(averageOrderValue._avg.totalPrice || 0),
      bookedRevenueToday: Number(bookedRevenueTodayResult._sum.totalPrice || 0),
      ordersByStatus: statusCounts,
      monthOverMonthGrowth: ordersLastMonth > 0 
        ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth * 100).toFixed(1)
        : null,
      bookedRevenueGrowth: bookedLastMonthValue > 0
        ? ((bookedThisMonthValue - bookedLastMonthValue) / bookedLastMonthValue * 100).toFixed(1)
        : null,
      // Collected cash semantics (real payments)
      collectedCashTotal: Number(collectedCashTotal._sum.amount || 0),
      collectedCashThisMonth: Number(collectedCashThisMonth._sum.amount || 0),
      collectedCashToday: Number(collectedCashToday._sum.amount || 0),
      // Completed revenue semantics (PICKED_UP + DELIVERED)
      completedRevenueTotal: Number(completedRevenueTotal._sum.totalPrice || 0),
      completedRevenueThisMonth: Number(completedRevenueThisMonth._sum.totalPrice || 0),
      completedRevenueToday: Number(completedRevenueToday._sum.totalPrice || 0),
      // Backward-compatible aliases (to avoid UI regressions during rollout)
      totalRevenue: Number(totalBookedRevenue._sum.totalPrice || 0),
      revenueThisMonth: bookedThisMonthValue,
      revenueLastMonth: bookedLastMonthValue,
      todayRevenue: Number(bookedRevenueTodayResult._sum.totalPrice || 0),
      revenueGrowth: bookedLastMonthValue > 0
        ? ((bookedThisMonthValue - bookedLastMonthValue) / bookedLastMonthValue * 100).toFixed(1)
        : null,
    };
  },

  async getBestSellers(shopId: string, limit = 5) {
    // Get orders with frames grouped by frame
    const ordersWithFrames = await prisma.order.findMany({
      where: {
        shopId,
        status: { notIn: ['CANCELLED'] },
        frameId: { not: null },
      },
      select: {
        frameId: true,
        framePrice: true,
        frame: {
          select: {
            id: true,
            reference: true,
            brand: { select: { name: true } },
          },
        },
      },
    });

    // Get orders with lenses grouped by lens
    const ordersWithLenses = await prisma.order.findMany({
      where: {
        shopId,
        status: { notIn: ['CANCELLED'] },
        lensId: { not: null },
      },
      select: {
        lensId: true,
        lensPrice: true,
        lens: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Aggregate frames
    const frameStats = new Map<string, { frame: any; count: number; revenue: number }>();
    for (const order of ordersWithFrames) {
      if (order.frame) {
        const existing = frameStats.get(order.frame.id) || { frame: order.frame, count: 0, revenue: 0 };
        existing.count++;
        existing.revenue += Number(order.framePrice || 0);
        frameStats.set(order.frame.id, existing);
      }
    }

    // Aggregate lenses
    const lensStats = new Map<string, { lens: any; count: number; revenue: number }>();
    for (const order of ordersWithLenses) {
      if (order.lens) {
        const existing = lensStats.get(order.lens.id) || { lens: order.lens, count: 0, revenue: 0 };
        existing.count++;
        existing.revenue += Number(order.lensPrice || 0);
        lensStats.set(order.lens.id, existing);
      }
    }

    // Sort and limit
    const topFrames = Array.from(frameStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(f => ({
        id: f.frame.id,
        reference: f.frame.reference,
        brand: f.frame.brand,
        salesCount: f.count,
        revenue: f.revenue,
      }));

    const topLenses = Array.from(lensStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(l => ({
        id: l.lens.id,
        name: l.lens.name,
        salesCount: l.count,
        revenue: l.revenue,
      }));

    return { frames: topFrames, lenses: topLenses };
  },

  /**
   * BUSINESS INTELLIGENCE - Owner Mode
   * Predictive insights, financial awareness, and business metrics
   */
  async getBusinessIntelligence(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      // Predictive: Orders due tomorrow
      ordersDueTomorrow,
      // Predictive: Critical stock (will run out soon based on sales velocity)
      criticalStockItems,
      // Predictive: Atelier load today vs capacity
      atelierLoadToday,
      // Financial: Remaining to collect on non-cancelled, non-draft orders
      remainingToCollectData,
      // Financial: Cash coming (ready orders total)
      cashComingData,
      // Financial: Collected cash from payment records
      collectedCashToday,
      collectedCashThisMonth,
      // Booked revenue snapshots
      bookedRevenueToday,
      bookedRevenueThisMonth,
      // Financial: Today's completed revenue
      completedTodayRevenue,
      // Top client this week
      topClientThisWeek,
      // Orders completed today
      ordersCompletedToday,
    ] = await Promise.all([
      // Orders due tomorrow
      prisma.order.count({
        where: {
          shopId,
          status: { in: ['CONFIRMED', 'IN_ATELIER'] },
          dueDate: { gte: tomorrow, lt: dayAfterTomorrow },
        },
      }),
      // Critical stock items (quantity <= 2)
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM (
          SELECT id FROM frames WHERE shop_id = ${shopId} AND is_active = true AND quantity <= 2
          UNION ALL
          SELECT id FROM lenses WHERE shop_id = ${shopId} AND is_active = true AND quantity <= 2
        ) as critical_items
      `,
      // Atelier jobs for today
      prisma.order.count({
        where: {
          shopId,
          status: 'IN_ATELIER',
        },
      }),
      // Remaining to collect (includes fully unpaid orders too)
      prisma.$queryRaw<[{ count: bigint; remaining: any }]>`
        SELECT
          COUNT(*) as count,
          COALESCE(SUM(total_price - deposit), 0) as remaining
        FROM orders
        WHERE shop_id = ${shopId}
          AND status NOT IN ('CANCELLED', 'DRAFT')
          AND total_price > deposit
      `,
      // Cash coming soon (ready orders)
      prisma.$queryRaw<[{ count: bigint; remaining: any }]>`
        SELECT
          COUNT(*) as count,
          COALESCE(SUM(total_price - deposit), 0) as remaining
        FROM orders
        WHERE shop_id = ${shopId}
          AND status IN ('READY', 'READY_FOR_PICKUP')
          AND total_price > deposit
      `,
      prisma.payment.aggregate({
        where: { shopId, createdAt: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { shopId, createdAt: { gte: thisMonthStart } },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: { shopId, createdAt: { gte: today, lt: tomorrow }, status: { notIn: ['CANCELLED'] } },
        _sum: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: { shopId, createdAt: { gte: thisMonthStart }, status: { notIn: ['CANCELLED'] } },
        _sum: { totalPrice: true },
      }),
      // Completed today (picked up or delivered)
      prisma.order.aggregate({
        where: {
          shopId,
          status: { in: ['PICKED_UP', 'DELIVERED'] },
          updatedAt: { gte: today, lt: tomorrow },
        },
        _sum: { totalPrice: true },
        _count: { id: true },
      }),
      // Top client this week by order count
      prisma.order.groupBy({
        by: ['clientId'],
        where: {
          shopId,
          createdAt: { gte: thisWeekStart },
          clientId: { not: undefined },
          status: { notIn: ['CANCELLED'] },
        },
        _count: { id: true },
        _sum: { totalPrice: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
      // Orders completed today
      prisma.order.count({
        where: {
          shopId,
          status: { in: ['PICKED_UP', 'DELIVERED'] },
          updatedAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    // Get top client details if exists
    let topClient = null;
    if (topClientThisWeek.length > 0 && topClientThisWeek[0]?.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: topClientThisWeek[0].clientId },
        select: { firstName: true, lastName: true },
      });
      if (client) {
        const countData = topClientThisWeek[0]._count;
        const sumData = topClientThisWeek[0]._sum;
        topClient = {
          name: `${client.firstName} ${client.lastName}`.trim(),
          ordersCount: typeof countData === 'object' ? (countData.id ?? 0) : 0,
          totalSpent: Number(sumData?.totalPrice || 0),
        };
      }
    }

    // Calculate financial metrics
    const totalUnpaid = Number(remainingToCollectData[0]?.remaining || 0);
    const unpaidOrdersCount = Number(remainingToCollectData[0]?.count || 0);
    const cashComing = Number(cashComingData[0]?.remaining || 0);
    const readyOrdersCount = Number(cashComingData[0]?.count || 0);

    // Atelier capacity assessment (simple: >5 = overloaded, >3 = busy)
    let atelierStatus: 'normal' | 'busy' | 'overloaded' = 'normal';
    if (atelierLoadToday > 5) atelierStatus = 'overloaded';
    else if (atelierLoadToday > 3) atelierStatus = 'busy';

    return {
      // Predictive insights
      predictive: {
        ordersDueTomorrow,
        criticalStockItems: Number(criticalStockItems[0]?.count || 0),
        atelierStatus,
        atelierLoad: atelierLoadToday,
      },
      // Financial awareness
      financial: {
        cashToCollect: totalUnpaid > 0 ? totalUnpaid : 0,
        unpaidOrdersCount,
        cashComing,
        readyOrdersCount,
        collectedCashToday: Number(collectedCashToday._sum.amount || 0),
        collectedCashThisMonth: Number(collectedCashThisMonth._sum.amount || 0),
        bookedRevenueToday: Number(bookedRevenueToday._sum.totalPrice || 0),
        bookedRevenueThisMonth: Number(bookedRevenueThisMonth._sum.totalPrice || 0),
        completedTodayRevenue: Number(completedTodayRevenue._sum.totalPrice || 0),
        ordersCompletedToday,
      },
      // Smart insights
      insights: {
        topClient,
      },
    };
  },
};
