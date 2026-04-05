import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateClientInput, UpdateClientInput, ClientQuery } from './clients.schema.js';

export const clientsService = {
  async findAll(shopId: string, query: ClientQuery) {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      shopId,
      isActive: true,
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string, shopId: string) {
    const client = await prisma.client.findFirst({
      where: { id, shopId },
      include: {
        prescriptions: { orderBy: { createdAt: 'desc' } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            frame: { select: { reference: true, model: true } },
            lens: { select: { name: true } },
          },
        },
      },
    });

    if (!client) {
      throw new AppError(404, 'Client not found');
    }

    return client;
  },

  async create(shopId: string, input: CreateClientInput) {
    return prisma.client.create({
      data: {
        shopId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        notes: input.notes,
      },
    });
  },

  async update(id: string, shopId: string, input: UpdateClientInput) {
    const client = await prisma.client.findFirst({ where: { id, shopId } });
    if (!client) {
      throw new AppError(404, 'Client not found');
    }

    return prisma.client.update({
      where: { id },
      data: {
        ...input,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      },
    });
  },

  async delete(id: string, shopId: string) {
    const client = await prisma.client.findFirst({ where: { id, shopId } });
    if (!client) {
      throw new AppError(404, 'Client not found');
    }

    await prisma.client.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  },
};
