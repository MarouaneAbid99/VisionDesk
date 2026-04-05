import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { UpdateAtelierJobInput, UpdateAtelierJobStatusInput, AtelierQuery } from './atelier.schema.js';
import { automationService } from '../automation/automation.service.js';
import {
  ORDER_TO_ATELIER_STATUS,
  ATELIER_TO_ORDER_STATUS,
  ATELIER_VISIBLE_ORDER_STATUSES,
  getAtelierStatusFromOrder,
  getOrderStatusFromAtelier,
} from '../../lib/businessLogic.js';

export const atelierService = {
  async findAll(shopId: string, query: AtelierQuery) {
    const { status, technicianId, page, limit } = query;
    const skip = (page - 1) * limit;

    // Build where clause - CRITICAL: Only show orders in valid atelier states
    const where: any = { 
      shopId,
      order: {
        status: { in: [...ATELIER_VISIBLE_ORDER_STATUSES, 'READY_FOR_PICKUP' as any] }
      }
    };
    
    // Filter by derived atelier status (maps to order status)
    if (status) {
      const orderStatus = ATELIER_TO_ORDER_STATUS[status];
      if (orderStatus) {
        if (orderStatus === 'READY') {
          // READY includes legacy READY_FOR_PICKUP for exact atelier visibility semantics.
          where.order.status = { in: ['READY', 'READY_FOR_PICKUP'] };
        } else {
          where.order.status = orderStatus;
        }
      }
    }
    
    if (technicianId) where.technicianId = technicianId;

    const [jobs, total] = await Promise.all([
      prisma.atelierJob.findMany({
        where,
        include: {
          order: {
            include: {
              client: { select: { id: true, firstName: true, lastName: true } },
              frame: { select: { id: true, reference: true, model: true, brand: { select: { name: true } } } },
              lens: { select: { id: true, name: true } },
            },
          },
          technician: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.atelierJob.count({ where }),
    ]);

    // Derive atelier status from order status for each job
    const jobsWithDerivedStatus = jobs.map(job => ({
      ...job,
      status:
        ORDER_TO_ATELIER_STATUS[job.order.status === 'READY_FOR_PICKUP' ? 'READY' : job.order.status] ||
        job.status,
    }));

    return {
      jobs: jobsWithDerivedStatus,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async findById(id: string, shopId: string) {
    const job = await prisma.atelierJob.findFirst({
      where: { id, shopId },
      include: {
        order: {
          include: {
            client: true,
            prescription: true,
            frame: { include: { brand: true } },
            lens: true,
          },
        },
        technician: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    if (!job) throw new AppError(404, 'Atelier job not found');
    return job;
  },

  async update(id: string, shopId: string, input: UpdateAtelierJobInput) {
    const job = await prisma.atelierJob.findFirst({ where: { id, shopId } });
    if (!job) throw new AppError(404, 'Atelier job not found');

    return prisma.atelierJob.update({
      where: { id },
      data: input,
    });
  },

  async updateStatus(id: string, shopId: string, input: UpdateAtelierJobStatusInput) {
    const job = await prisma.atelierJob.findFirst({ 
      where: { id, shopId },
      include: { order: true }
    });
    if (!job) throw new AppError(404, 'Atelier job not found');

    // Get the corresponding Order status
    const newOrderStatus = ATELIER_TO_ORDER_STATUS[input.status];
    if (!newOrderStatus) {
      throw new AppError(400, `Invalid atelier status: ${input.status}`);
    }

    const atelierUpdates: any = {};
    const orderUpdates: any = { status: newOrderStatus };

    // Track timestamps
    if (input.status === 'IN_PROGRESS' && !job.startedAt) {
      atelierUpdates.startedAt = new Date();
    }

    if (input.status === 'READY') {
      atelierUpdates.completedAt = new Date();
      orderUpdates.readyAt = new Date();
    }

    // Update Order status first (single source of truth)
    const order = await prisma.order.update({
      where: { id: job.orderId },
      data: orderUpdates,
      include: { client: { select: { firstName: true, lastName: true } } },
    });

    // Create pickup reminder when READY
    if (input.status === 'READY') {
      const clientName = `${order.client.firstName} ${order.client.lastName}`;
      await automationService.createPickupReminder(shopId, job.orderId, order.orderNumber, clientName);
    }

    // Update AtelierJob metadata (timestamps, notes) but NOT status
    // Status is derived from Order
    if (Object.keys(atelierUpdates).length > 0) {
      await prisma.atelierJob.update({
        where: { id },
        data: atelierUpdates,
      });
    }

    // Return job with derived status
    const updatedJob = await prisma.atelierJob.findFirst({
      where: { id },
      include: {
        order: {
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            frame: { select: { id: true, reference: true, model: true } },
            lens: { select: { id: true, name: true } },
          },
        },
        technician: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return {
      ...updatedJob,
      status: ORDER_TO_ATELIER_STATUS[newOrderStatus] || input.status,
    };
  },
};
