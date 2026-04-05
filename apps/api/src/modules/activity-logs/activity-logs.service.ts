import { prisma } from '../../lib/prisma.js';

export const activityLogsService = {
  async findAll(shopId: string, query: { userId?: string; action?: string; page: number; limit: number }) {
    const { userId, action, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { shopId };
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async create(shopId: string, userId: string | null, data: { action: string; entityType?: string; entityId?: string; details?: any; ipAddress?: string; userAgent?: string }) {
    return prisma.activityLog.create({
      data: {
        shopId,
        userId,
        ...data,
      },
    });
  },
};
