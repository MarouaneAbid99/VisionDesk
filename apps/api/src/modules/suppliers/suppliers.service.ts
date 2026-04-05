import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateSupplierInput, UpdateSupplierInput } from './suppliers.schema.js';

export const suppliersService = {
  async findAll(shopId: string) {
    return prisma.supplier.findMany({
      where: { shopId, isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string, shopId: string) {
    const supplier = await prisma.supplier.findFirst({ where: { id, shopId } });
    if (!supplier) {
      throw new AppError(404, 'Supplier not found');
    }
    return supplier;
  },

  async create(shopId: string, input: CreateSupplierInput) {
    return prisma.supplier.create({
      data: { shopId, ...input },
    });
  },

  async update(id: string, shopId: string, input: UpdateSupplierInput) {
    const supplier = await prisma.supplier.findFirst({ where: { id, shopId } });
    if (!supplier) {
      throw new AppError(404, 'Supplier not found');
    }
    return prisma.supplier.update({ where: { id }, data: input });
  },

  async delete(id: string, shopId: string) {
    const supplier = await prisma.supplier.findFirst({ where: { id, shopId } });
    if (!supplier) {
      throw new AppError(404, 'Supplier not found');
    }
    await prisma.supplier.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  },
};
