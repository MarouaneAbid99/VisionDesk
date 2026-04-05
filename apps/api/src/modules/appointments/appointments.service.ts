import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateAppointmentInput, UpdateAppointmentInput, UpdateAppointmentStatusInput, AppointmentQuery } from './appointments.schema.js';

export const appointmentsService = {
  async findAll(shopId: string, query: AppointmentQuery) {
    const { search, status, appointmentType, clientId, dateFrom, dateTo, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { shopId };

    if (status) where.status = status;
    if (appointmentType) where.appointmentType = appointmentType;
    if (clientId) where.clientId = clientId;

    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = new Date(dateFrom);
      if (dateTo) where.scheduledAt.lte = new Date(dateTo);
    }

    if (search) {
      where.client = {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async findById(id: string, shopId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, shopId },
      include: {
        client: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!appointment) throw new AppError(404, 'Appointment not found');
    return appointment;
  },

  async findUpcoming(shopId: string, limit: number = 10) {
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

  async findTodayCount(shopId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.appointment.count({
      where: {
        shopId,
        scheduledAt: { gte: today, lt: tomorrow },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    });
  },

  async create(shopId: string, userId: string, input: CreateAppointmentInput) {
    const client = await prisma.client.findFirst({ where: { id: input.clientId, shopId } });
    if (!client) throw new AppError(404, 'Client not found');

    return prisma.appointment.create({
      data: {
        shopId,
        clientId: input.clientId,
        createdById: userId,
        appointmentType: input.appointmentType,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes,
        notes: input.notes,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

  async update(id: string, shopId: string, input: UpdateAppointmentInput) {
    const appointment = await prisma.appointment.findFirst({ where: { id, shopId } });
    if (!appointment) throw new AppError(404, 'Appointment not found');

    if (input.clientId) {
      const client = await prisma.client.findFirst({ where: { id: input.clientId, shopId } });
      if (!client) throw new AppError(404, 'Client not found');
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        ...input,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },

  async updateStatus(id: string, shopId: string, input: UpdateAppointmentStatusInput) {
    const appointment = await prisma.appointment.findFirst({ where: { id, shopId } });
    if (!appointment) throw new AppError(404, 'Appointment not found');

    return prisma.appointment.update({
      where: { id },
      data: { status: input.status },
    });
  },

  async delete(id: string, shopId: string) {
    const appointment = await prisma.appointment.findFirst({ where: { id, shopId } });
    if (!appointment) throw new AppError(404, 'Appointment not found');

    await prisma.appointment.delete({ where: { id } });
    return { success: true };
  },
};
