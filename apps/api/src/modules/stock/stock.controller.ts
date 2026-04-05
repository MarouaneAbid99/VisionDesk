import { Request, Response, NextFunction } from 'express';
import { stockService } from './stock.service.js';

export const stockController = {
  async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const shopId = req.user!.shopId!;
      const data = await stockService.getLowStockItems(shopId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getReorderSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const shopId = req.user!.shopId!;
      const data = await stockService.getReorderSuggestions(shopId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getStockMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const shopId = req.user!.shopId!;
      const { frameId, lensId, limit } = req.query;
      const data = await stockService.getStockMovements(shopId, {
        frameId: frameId as string,
        lensId: lensId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getStockSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const shopId = req.user!.shopId!;
      const data = await stockService.getStockSummary(shopId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
