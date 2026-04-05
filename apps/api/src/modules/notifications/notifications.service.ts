import { prisma } from '../../lib/prisma.js';
import { CreateNotificationInput, NotificationsQuery } from './notifications.schema.js';

export const notificationsService = {
  async findAll(shopId: string, userId: string, query: NotificationsQuery) {
    const { page, limit, unreadOnly } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      shopId,
      OR: [{ userId: null }, { userId }],
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getUnreadCount(shopId: string, userId: string) {
    const count = await prisma.notification.count({
      where: {
        shopId,
        isRead: false,
        OR: [{ userId: null }, { userId }],
      },
    });
    return count;
  },

  async markAsRead(id: string, shopId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        shopId,
        OR: [{ userId: null }, { userId }],
      },
    });

    if (!notification) return null;

    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async markAllAsRead(shopId: string, userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        shopId,
        isRead: false,
        OR: [{ userId: null }, { userId }],
      },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  },

  async create(shopId: string, input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        shopId,
        ...input,
      },
    });
  },

  async createMany(shopId: string, notifications: CreateNotificationInput[]) {
    return prisma.notification.createMany({
      data: notifications.map((n) => ({ shopId, ...n })),
    });
  },
};
