import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateUserInput, UpdateUserInput } from './users.schema.js';

export const usersService = {
  async findAll(shopId: string) {
    return prisma.user.findMany({
      where: { shopId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string, shopId: string) {
    const user = await prisma.user.findFirst({
      where: { id, shopId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  },

  async create(shopId: string, input: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError(400, 'Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    return prisma.user.create({
      data: {
        shopId,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role || 'OPTICIAN',
        phone: input.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  async update(id: string, shopId: string, input: UpdateUserInput) {
    const user = await prisma.user.findFirst({
      where: { id, shopId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (input.email && input.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new AppError(400, 'Email already in use');
      }
    }

    return prisma.user.update({
      where: { id },
      data: input,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  async delete(id: string, shopId: string) {
    const user = await prisma.user.findFirst({
      where: { id, shopId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await prisma.user.delete({ where: { id } });
    return { success: true };
  },
};
