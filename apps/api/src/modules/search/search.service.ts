import { prisma } from '../../lib/prisma.js';

export const searchService = {
  async globalSearch(shopId: string, query: string, limit = 5) {
    if (!query || query.length < 2) {
      return { clients: [], orders: [], frames: [], lenses: [] };
    }

    const [clients, orders, frames, lenses] = await Promise.all([
      prisma.client.findMany({
        where: {
          shopId,
          isActive: true,
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
        take: limit,
        orderBy: { lastName: 'asc' },
      }),

      prisma.order.findMany({
        where: {
          shopId,
          OR: [
            { orderNumber: { contains: query } },
            { client: { firstName: { contains: query } } },
            { client: { lastName: { contains: query } } },
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,
          client: {
            select: { firstName: true, lastName: true },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      prisma.frame.findMany({
        where: {
          shopId,
          isActive: true,
          OR: [
            { reference: { contains: query } },
            { model: { contains: query } },
            { color: { contains: query } },
            { brand: { name: { contains: query } } },
          ],
        },
        select: {
          id: true,
          reference: true,
          model: true,
          color: true,
          quantity: true,
          brand: { select: { name: true } },
        },
        take: limit,
        orderBy: { reference: 'asc' },
      }),

      prisma.lens.findMany({
        where: {
          shopId,
          isActive: true,
          OR: [
            { name: { contains: query } },
            { index: { contains: query } },
            { supplier: { name: { contains: query } } },
          ],
        },
        select: {
          id: true,
          name: true,
          lensType: true,
          index: true,
          quantity: true,
          supplier: { select: { name: true } },
        },
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return { clients, orders, frames, lenses };
  },
};
