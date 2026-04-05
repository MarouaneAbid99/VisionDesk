import { prisma } from '../../lib/prisma.js';

export const stockMovementsService = {
  async findAll(shopId: string, query: { frameId?: string; lensId?: string; page: number; limit: number }) {
    const { frameId, lensId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { shopId };
    if (frameId) where.frameId = frameId;
    if (lensId) where.lensId = lensId;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          frame: { select: { id: true, reference: true, model: true } },
          lens: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      movements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
};
