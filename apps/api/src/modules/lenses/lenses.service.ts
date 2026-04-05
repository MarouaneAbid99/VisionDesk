import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateLensInput, UpdateLensInput, LensQuery } from './lenses.schema.js';
import { automationService } from '../automation/automation.service.js';

export const lensesService = {
  async findAll(shopId: string, query: LensQuery) {
    const { search, lensType, supplierId, lowStock, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { shopId, isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (lensType) where.lensType = lensType;
    if (supplierId) where.supplierId = supplierId;

    const [lenses, total] = await Promise.all([
      prisma.lens.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.lens.count({ where }),
    ]);

    const result = lowStock
      ? lenses.filter((l) => l.quantity <= l.reorderLevel)
      : lenses;

    return {
      lenses: result,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async findById(id: string, shopId: string) {
    const lens = await prisma.lens.findFirst({
      where: { id, shopId },
      include: { supplier: true },
    });

    if (!lens) throw new AppError(404, 'Lens not found');
    return lens;
  },

  async create(shopId: string, input: CreateLensInput) {
    const lens = await prisma.lens.create({
      data: { shopId, ...input },
    });

    await prisma.stockMovement.create({
      data: {
        shopId,
        lensId: lens.id,
        type: 'IN',
        quantity: input.quantity || 0,
        reason: 'Initial stock',
      },
    });

    return lens;
  },

  async update(id: string, shopId: string, input: UpdateLensInput) {
    const lens = await prisma.lens.findFirst({ where: { id, shopId } });
    if (!lens) throw new AppError(404, 'Lens not found');

    if (input.quantity !== undefined && input.quantity !== lens.quantity) {
      const diff = input.quantity - lens.quantity;
      await prisma.stockMovement.create({
        data: {
          shopId,
          lensId: id,
          type: diff > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(diff),
          reason: 'Stock adjustment',
        },
      });
    }

    const updatedLens = await prisma.lens.update({ where: { id }, data: input });

    if (updatedLens.quantity <= updatedLens.reorderLevel) {
      await automationService.createLowStockAlert(shopId, 'lens', id, updatedLens.name, updatedLens.quantity, updatedLens.reorderLevel);
    }

    return updatedLens;
  },

  async delete(id: string, shopId: string) {
    const lens = await prisma.lens.findFirst({ where: { id, shopId } });
    if (!lens) throw new AppError(404, 'Lens not found');

    await prisma.lens.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  },
};
