import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateOrderInput, UpdateOrderInput, UpdateOrderStatusInput, OrderQuery } from './orders.schema.js';
import { automationService } from '../automation/automation.service.js';
import { calculatePaymentStatus } from '../../lib/businessLogic.js';
import { assertDepositMatchesLedger, sumPaymentsForOrder } from '../../lib/paymentLedger.js';

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

export const ordersService = {
  async findAll(shopId: string, query: OrderQuery) {
    const { search, status, clientId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { shopId };

    if (search) {
      where.orderNumber = { contains: search };
    }
    if (status) {
      // READY includes legacy READY_FOR_PICKUP for exact “Prêtes” semantics.
      if (status === 'READY') {
        where.status = { in: ['READY', 'READY_FOR_PICKUP'] };
      } else if (status === 'COMPLETED') {
        where.status = { in: ['PICKED_UP', 'DELIVERED'] };
      } else {
        where.status = status;
      }
    }
    if (clientId) where.clientId = clientId;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          frame: { select: { id: true, reference: true, model: true } },
          lens: { select: { id: true, name: true } },
          atelierJob: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => ({
        ...o,
        status: o.status === 'READY_FOR_PICKUP' ? 'READY' : o.status,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async findById(id: string, shopId: string) {
    const order = await prisma.order.findFirst({
      where: { id, shopId },
      include: {
        client: true,
        prescription: true,
        frame: { include: { brand: true } },
        lens: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        atelierJob: { include: { technician: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });

    if (!order) throw new AppError(404, 'Order not found');
    return order;
  },

  async create(shopId: string, userId: string, input: CreateOrderInput) {
    const client = await prisma.client.findFirst({ where: { id: input.clientId, shopId } });
    if (!client) throw new AppError(404, 'Client not found');

    const totalPrice = input.framePrice + input.lensPrice + input.servicePrice - input.discount;
    const deposit = input.deposit || 0;
    const paymentStatus = calculatePaymentStatus(deposit, totalPrice);

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          shopId,
          clientId: input.clientId,
          prescriptionId: input.prescriptionId,
          frameId: input.frameId,
          lensId: input.lensId,
          createdById: userId,
          orderNumber: generateOrderNumber(),
          framePrice: input.framePrice,
          lensPrice: input.lensPrice,
          servicePrice: input.servicePrice,
          discount: input.discount,
          deposit,
          totalPrice,
          paymentStatus,
          paidAt: paymentStatus === 'PAID' ? new Date() : null,
          notes: input.notes,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
        include: {
          client: { select: { firstName: true, lastName: true } },
        },
      });

      if (deposit > 0) {
        await tx.payment.create({
          data: {
            shopId,
            orderId: order.id,
            amount: deposit,
            createdById: userId,
            notes: 'Acompte initial',
          },
        });
      }

      const sum = await sumPaymentsForOrder(tx, order.id);
      assertDepositMatchesLedger(order.id, deposit, sum, 'after create');

      return order;
    });
  },

  async update(id: string, shopId: string, input: UpdateOrderInput) {
    const order = await prisma.order.findFirst({ where: { id, shopId } });
    if (!order) throw new AppError(404, 'Order not found');

    // PRICING IMMUTABILITY: All pricing fields are frozen after creation.
    // These values are ALWAYS read from the existing order, never from input.
    // Payments are handled separately via addPayment endpoint.

    return prisma.order.update({
      where: { id },
      data: {
        clientId: input.clientId,
        prescriptionId: input.prescriptionId,
        frameId: input.frameId,
        lensId: input.lensId,
        // Pricing fields intentionally omitted - they remain unchanged
        notes: input.notes,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
    });
  },

  async updateStatus(id: string, shopId: string, input: UpdateOrderStatusInput) {
    const order = await prisma.order.findFirst({
      where: { id, shopId },
      include: { 
        client: { select: { firstName: true, lastName: true } },
        frame: { select: { id: true, quantity: true } },
        lens: { select: { id: true, quantity: true } },
      },
    });
    if (!order) throw new AppError(404, 'Order not found');

    const updates: any = { status: input.status };

    // STOCK DECREMENT: When order is CONFIRMED, decrease stock quantities
    if (input.status === 'CONFIRMED' && order.status === 'DRAFT') {
      // Check frame stock availability
      if (order.frame) {
        if (order.frame.quantity <= 0) {
          throw new AppError(400, `Stock insuffisant pour la monture. Stock actuel: ${order.frame.quantity}`);
        }
        await prisma.frame.update({
          where: { id: order.frame.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      // Check lens stock availability
      if (order.lens) {
        if (order.lens.quantity <= 0) {
          throw new AppError(400, `Stock insuffisant pour les verres. Stock actuel: ${order.lens.quantity}`);
        }
        await prisma.lens.update({
          where: { id: order.lens.id },
          data: { quantity: { decrement: 1 } },
        });
      }

    }

    if (input.status === 'READY') {
      updates.readyAt = new Date();

      const clientName = `${order.client.firstName} ${order.client.lastName}`;
      await automationService.createPickupReminder(shopId, id, order.orderNumber, clientName);
    }

    if (input.status === 'PICKED_UP') {
      updates.pickedUpAt = new Date();
    }

    if (input.status === 'DELIVERED') {
      updates.deliveredAt = new Date();
    }

    if (input.status === 'IN_ATELIER') {
      const existingJob = await prisma.atelierJob.findUnique({ where: { orderId: id } });
      if (!existingJob) {
        await prisma.atelierJob.create({
          data: {
            shopId,
            orderId: id,
            status: 'PENDING',
          },
        });
      }
    }

    // STOCK RESTORE: If order is CANCELLED from CONFIRMED state, restore stock
    if (input.status === 'CANCELLED' && order.status !== 'DRAFT' && order.status !== 'CANCELLED') {
      if (order.frame) {
        await prisma.frame.update({
          where: { id: order.frame.id },
          data: { quantity: { increment: 1 } },
        });
      }
      if (order.lens) {
        await prisma.lens.update({
          where: { id: order.lens.id },
          data: { quantity: { increment: 1 } },
        });
      }
    }

    return prisma.order.update({
      where: { id },
      data: updates,
    });
  },

  async delete(id: string, shopId: string) {
    const order = await prisma.order.findFirst({ where: { id, shopId } });
    if (!order) throw new AppError(404, 'Order not found');

    if (order.status !== 'DRAFT' && order.status !== 'CANCELLED') {
      throw new AppError(400, 'Only draft or cancelled orders can be deleted');
    }

    await prisma.order.delete({ where: { id } });
    return { success: true };
  },

  async addPayment(id: string, shopId: string, amount: number, userId: string | undefined) {
    if (!userId) {
      throw new AppError(401, 'Authentification requise pour enregistrer un paiement');
    }

    const order = await prisma.order.findFirst({ where: { id, shopId } });
    if (!order) throw new AppError(404, 'Order not found');

    const totalPrice = Number(order.totalPrice);
    const currentDeposit = Number(order.deposit);
    const remaining = totalPrice - currentDeposit;

    if (amount <= 0) {
      throw new AppError(400, 'Le montant doit être positif');
    }

    if (amount > remaining) {
      throw new AppError(400, `Le montant ne peut pas dépasser le reste à payer (${remaining.toFixed(2)} MAD)`);
    }

    const newDeposit = currentDeposit + amount;
    const paymentStatus = calculatePaymentStatus(newDeposit, totalPrice);
    const isNowPaid = paymentStatus === 'PAID';

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          shopId,
          orderId: id,
          amount,
          createdById: userId,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          deposit: newDeposit,
          paymentStatus,
          paidAt: isNowPaid ? new Date() : null,
        },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          frame: { include: { brand: true } },
          lens: true,
          prescription: true,
          atelierJob: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { firstName: true, lastName: true } } },
          },
        },
      });

      const sum = await sumPaymentsForOrder(tx, id);
      if (Math.abs(sum - newDeposit) > 0.01) {
        throw new AppError(500, 'Incohérence du registre de paiement après encaissement');
      }

      return updatedOrder;
    });

    return updated;
  },

  async getPaymentHistory(orderId: string, shopId: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, shopId } });
    if (!order) throw new AppError(404, 'Order not found');

    const payments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    const sum = await sumPaymentsForOrder(prisma, orderId);
    assertDepositMatchesLedger(orderId, Number(order.deposit), sum, 'getPaymentHistory');

    return payments;
  },
};
