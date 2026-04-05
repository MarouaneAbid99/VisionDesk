import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

export const shopsService = {
  async findAll() {
    return prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string) {
    const shop = await prisma.shop.findUnique({
      where: { id },
    });

    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    return shop;
  },

  async create(data: { name: string; address?: string; phone?: string; email?: string }) {
    return prisma.shop.create({ data });
  },

  async update(id: string, data: { name?: string; address?: string; phone?: string; email?: string; isActive?: boolean }) {
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    return prisma.shop.update({ where: { id }, data });
  },

  async delete(id: string) {
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    await prisma.shop.delete({ where: { id } });
    return { success: true };
  },
};
