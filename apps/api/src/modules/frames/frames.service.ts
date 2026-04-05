import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { CreateFrameInput, UpdateFrameInput, FrameQuery } from './frames.schema.js';
import { automationService } from '../automation/automation.service.js';

export const framesService = {
  async findAll(shopId: string, query: FrameQuery) {
    const { search, brandId, supplierId, lowStock, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { shopId, isActive: true };

    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { model: { contains: search } },
        { color: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (brandId) where.brandId = brandId;
    if (supplierId) where.supplierId = supplierId;

    const [frames, total] = await Promise.all([
      prisma.frame.findMany({
        where,
        include: {
          brand: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.frame.count({ where }),
    ]);

    const result = lowStock
      ? frames.filter((f) => f.quantity <= f.reorderLevel)
      : frames;

    return {
      frames: result,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async findById(id: string, shopId: string) {
    const frame = await prisma.frame.findFirst({
      where: { id, shopId },
      include: {
        brand: true,
        supplier: true,
      },
    });

    if (!frame) throw new AppError(404, 'Frame not found');
    return frame;
  },

  async create(shopId: string, input: CreateFrameInput) {
    const frame = await prisma.frame.create({
      data: { shopId, ...input },
    });

    await prisma.stockMovement.create({
      data: {
        shopId,
        frameId: frame.id,
        type: 'IN',
        quantity: input.quantity || 0,
        reason: 'Initial stock',
      },
    });

    return frame;
  },

  async update(id: string, shopId: string, input: UpdateFrameInput) {
    const frame = await prisma.frame.findFirst({ where: { id, shopId } });
    if (!frame) throw new AppError(404, 'Frame not found');

    if (input.quantity !== undefined && input.quantity !== frame.quantity) {
      const diff = input.quantity - frame.quantity;
      await prisma.stockMovement.create({
        data: {
          shopId,
          frameId: id,
          type: diff > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(diff),
          reason: 'Stock adjustment',
        },
      });
    }

    const updatedFrame = await prisma.frame.update({ where: { id }, data: input });

    if (updatedFrame.quantity <= updatedFrame.reorderLevel) {
      const itemName = `${updatedFrame.reference} - ${updatedFrame.model}`;
      await automationService.createLowStockAlert(shopId, 'frame', id, itemName, updatedFrame.quantity, updatedFrame.reorderLevel);
    }

    return updatedFrame;
  },

  async delete(id: string, shopId: string) {
    const frame = await prisma.frame.findFirst({ where: { id, shopId } });
    if (!frame) throw new AppError(404, 'Frame not found');

    await prisma.frame.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  },
};
