import { prisma } from '../../lib/prisma.js';

export const stockService = {
  async getLowStockItems(shopId: string) {
    const [lowStockFrames, lowStockLenses] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT f.*, b.name as brandName, s.id as supplierId, s.name as supplierName
        FROM frames f
        LEFT JOIN frame_brands b ON f.brand_id = b.id
        LEFT JOIN suppliers s ON f.supplier_id = s.id
        WHERE f.shop_id = ${shopId}
          AND f.is_active = true
          AND f.quantity <= f.reorder_level
        ORDER BY f.quantity ASC
      `,
      prisma.$queryRaw<any[]>`
        SELECT l.*, s.id as supplierId, s.name as supplierName
        FROM lenses l
        LEFT JOIN suppliers s ON l.supplier_id = s.id
        WHERE l.shop_id = ${shopId}
          AND l.is_active = true
          AND l.quantity <= l.reorder_level
        ORDER BY l.quantity ASC
      `,
    ]);

    const frames = lowStockFrames.map((f: any) => ({
      id: f.id,
      reference: f.reference,
      model: f.model,
      color: f.color,
      quantity: f.quantity,
      reorderLevel: f.reorder_level,
      brand: f.brandName ? { name: f.brandName } : null,
      supplier: f.supplierId ? { id: f.supplierId, name: f.supplierName } : null,
    }));

    const lenses = lowStockLenses.map((l: any) => ({
      id: l.id,
      name: l.name,
      lensType: l.lens_type,
      coating: l.coating,
      quantity: l.quantity,
      reorderLevel: l.reorder_level,
      supplier: l.supplierId ? { id: l.supplierId, name: l.supplierName } : null,
    }));

    return {
      frames,
      lenses,
      totalLowStock: frames.length + lenses.length,
    };
  },

  async getLowStockFrames(shopId: string) {
    const frames = await prisma.$queryRaw<any[]>`
      SELECT f.*, b.name as brandName, s.name as supplierName
      FROM frames f
      LEFT JOIN frame_brands b ON f.brand_id = b.id
      LEFT JOIN suppliers s ON f.supplier_id = s.id
      WHERE f.shop_id = ${shopId}
        AND f.is_active = true
        AND f.quantity <= f.reorder_level
      ORDER BY f.quantity ASC
    `;
    return frames;
  },

  async getLowStockLenses(shopId: string) {
    const lenses = await prisma.$queryRaw<any[]>`
      SELECT l.*, s.name as supplierName
      FROM lenses l
      LEFT JOIN suppliers s ON l.supplier_id = s.id
      WHERE l.shop_id = ${shopId}
        AND l.is_active = true
        AND l.quantity <= l.reorder_level
      ORDER BY l.quantity ASC
    `;
    return lenses;
  },

  async getReorderSuggestions(shopId: string) {
    const [frames, lenses] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT f.id, f.reference, f.model, f.color, f.quantity, f.reorder_level as reorderLevel, f.purchase_price as costPrice,
               b.name as brandName, s.id as supplierId, s.name as supplierName,
               (f.reorder_level * 2 - f.quantity) as suggestedQuantity
        FROM frames f
        LEFT JOIN frame_brands b ON f.brand_id = b.id
        LEFT JOIN suppliers s ON f.supplier_id = s.id
        WHERE f.shop_id = ${shopId}
          AND f.is_active = true
          AND f.quantity <= f.reorder_level
        ORDER BY f.quantity ASC
      `,
      prisma.$queryRaw<any[]>`
        SELECT l.id, l.name, l.lens_type as lensType, l.coating, l.quantity, l.reorder_level as reorderLevel, l.purchase_price as costPrice,
               s.id as supplierId, s.name as supplierName,
               (l.reorder_level * 2 - l.quantity) as suggestedQuantity
        FROM lenses l
        LEFT JOIN suppliers s ON l.supplier_id = s.id
        WHERE l.shop_id = ${shopId}
          AND l.is_active = true
          AND l.quantity <= l.reorder_level
        ORDER BY l.quantity ASC
      `,
    ]);

    const suggestions = [
      ...frames.map((f) => ({
        type: 'frame' as const,
        id: f.id,
        name: `${f.brandName || ''} ${f.reference}`.trim(),
        details: `${f.model || ''} - ${f.color || ''}`.trim(),
        currentStock: f.quantity,
        reorderLevel: f.reorderLevel,
        suggestedQuantity: Math.max(f.suggestedQuantity, 1),
        estimatedCost: f.costPrice * Math.max(f.suggestedQuantity, 1),
        supplierId: f.supplierId,
        supplierName: f.supplierName,
      })),
      ...lenses.map((l) => ({
        type: 'lens' as const,
        id: l.id,
        name: l.name,
        details: `${l.lensType} - ${l.coating}`,
        currentStock: l.quantity,
        reorderLevel: l.reorderLevel,
        suggestedQuantity: Math.max(l.suggestedQuantity, 1),
        estimatedCost: l.costPrice * Math.max(l.suggestedQuantity, 1),
        supplierId: l.supplierId,
        supplierName: l.supplierName,
      })),
    ];

    const bySupplier = suggestions.reduce((acc, item) => {
      const key = item.supplierId || 'unknown';
      if (!acc[key]) {
        acc[key] = {
          supplierId: item.supplierId,
          supplierName: item.supplierName || 'Unknown Supplier',
          items: [],
          totalEstimatedCost: 0,
        };
      }
      acc[key].items.push(item);
      acc[key].totalEstimatedCost += item.estimatedCost;
      return acc;
    }, {} as Record<string, any>);

    return {
      suggestions,
      bySupplier: Object.values(bySupplier),
      totalItems: suggestions.length,
      totalEstimatedCost: suggestions.reduce((sum, s) => sum + s.estimatedCost, 0),
    };
  },

  async getStockMovements(shopId: string, options: { frameId?: string; lensId?: string; limit?: number }) {
    const where: any = { shopId };
    if (options.frameId) where.frameId = options.frameId;
    if (options.lensId) where.lensId = options.lensId;

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        frame: { select: { reference: true, model: true } },
        lens: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
    });

    return movements;
  },

  async getStockSummary(shopId: string) {
    const [framesStats, lensesStats] = await Promise.all([
      prisma.frame.aggregate({
        where: { shopId, isActive: true },
        _count: true,
        _sum: { quantity: true },
      }),
      prisma.lens.aggregate({
        where: { shopId, isActive: true },
        _count: true,
        _sum: { quantity: true },
      }),
    ]);

    const [lowStockFrames, lowStockLenses] = await Promise.all([
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM frames 
        WHERE shop_id = ${shopId} AND is_active = true AND quantity <= reorder_level
      `,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM lenses 
        WHERE shop_id = ${shopId} AND is_active = true AND quantity <= reorder_level
      `,
    ]);

    return {
      frames: {
        totalItems: framesStats._count,
        totalQuantity: framesStats._sum.quantity || 0,
        lowStock: Number(lowStockFrames[0].count),
      },
      lenses: {
        totalItems: lensesStats._count,
        totalQuantity: lensesStats._sum.quantity || 0,
        lowStock: Number(lowStockLenses[0].count),
      },
      totalLowStock: Number(lowStockFrames[0].count) + Number(lowStockLenses[0].count),
    };
  },
};
