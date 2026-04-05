import { prisma } from '../../lib/prisma.js';
import { notificationsService } from '../notifications/notifications.service.js';

export const automationService = {
  /**
   * Create pickup reminder notification when order is marked READY
   */
  async createPickupReminder(shopId: string, orderId: string, orderNumber: string, clientName: string) {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        shopId,
        type: 'ORDER_READY',
        entityType: 'order',
        entityId: orderId,
        isRead: false,
      },
    });

    if (existingNotification) return;

    await notificationsService.create(shopId, {
      type: 'ORDER_READY',
      title: 'Commande prête',
      message: `La commande ${orderNumber} pour ${clientName} est prête à être retirée.`,
      entityType: 'order',
      entityId: orderId,
    });
  },

  /**
   * Create low stock alert notification
   */
  async createLowStockAlert(shopId: string, itemType: 'frame' | 'lens', itemId: string, itemName: string, quantity: number, reorderLevel: number) {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        shopId,
        type: 'LOW_STOCK',
        entityType: itemType,
        entityId: itemId,
        isRead: false,
      },
    });

    if (existingNotification) return;

    await notificationsService.create(shopId, {
      type: 'LOW_STOCK',
      title: 'Stock bas',
      message: `${itemName} - Stock: ${quantity} (seuil: ${reorderLevel})`,
      entityType: itemType,
      entityId: itemId,
    });
  },

  /**
   * Create appointment reminder for today's appointments
   */
  async createAppointmentReminders(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        shopId,
        scheduledAt: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
      },
    });

    for (const apt of todayAppointments) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          shopId,
          type: 'APPOINTMENT_SOON',
          entityType: 'appointment',
          entityId: apt.id,
          createdAt: { gte: today },
        },
      });

      if (existingNotification) continue;

      const time = new Date(apt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      await notificationsService.create(shopId, {
        type: 'APPOINTMENT_SOON',
        title: 'Rendez-vous aujourd\'hui',
        message: `${apt.client.firstName} ${apt.client.lastName} à ${time}`,
        entityType: 'appointment',
        entityId: apt.id,
      });
    }

    return todayAppointments.length;
  },

  /**
   * Check for delayed atelier jobs and create alerts
   */
  async checkAtelierDelays(shopId: string) {
    const now = new Date();

    const delayedJobs = await prisma.atelierJob.findMany({
      where: {
        shopId,
        status: { in: ['PENDING', 'IN_PROGRESS', 'BLOCKED'] },
        dueDate: { lt: now },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            client: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    let alertsCreated = 0;

    for (const job of delayedJobs) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          shopId,
          type: 'ORDER_OVERDUE',
          entityType: 'atelier_job',
          entityId: job.id,
          isRead: false,
        },
      });

      if (existingNotification) continue;

      await notificationsService.create(shopId, {
        type: 'ORDER_OVERDUE',
        title: 'Travail atelier en retard',
        message: `${job.order.orderNumber} - ${job.order.client.firstName} ${job.order.client.lastName} a dépassé sa date limite.`,
        entityType: 'atelier_job',
        entityId: job.id,
      });

      alertsCreated++;
    }

    return { delayedCount: delayedJobs.length, alertsCreated };
  },

  /**
   * Check all low stock items and create alerts
   */
  async checkLowStock(shopId: string) {
    const lowStockFrames = await prisma.frame.findMany({
      where: {
        shopId,
        isActive: true,
      },
    });

    const lowStockLenses = await prisma.lens.findMany({
      where: {
        shopId,
        isActive: true,
      },
    });

    let alertsCreated = 0;

    for (const frame of lowStockFrames) {
      if (frame.quantity <= frame.reorderLevel) {
        const itemName = `${frame.reference} - ${frame.model}`;
        await this.createLowStockAlert(shopId, 'frame', frame.id, itemName, frame.quantity, frame.reorderLevel);
        alertsCreated++;
      }
    }

    for (const lens of lowStockLenses) {
      if (lens.quantity <= lens.reorderLevel) {
        await this.createLowStockAlert(shopId, 'lens', lens.id, lens.name, lens.quantity, lens.reorderLevel);
        alertsCreated++;
      }
    }

    return alertsCreated;
  },

  /**
   * Run all daily automation checks for a shop
   */
  async runDailyChecks(shopId: string) {
    const results = {
      appointmentReminders: await this.createAppointmentReminders(shopId),
      atelierDelays: await this.checkAtelierDelays(shopId),
      lowStockAlerts: await this.checkLowStock(shopId),
    };

    return results;
  },
};
