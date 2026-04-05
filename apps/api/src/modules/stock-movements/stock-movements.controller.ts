import { Response, NextFunction } from 'express';
import { stockMovementsService } from './stock-movements.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export const stockMovementsController = {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const frameId = req.query.frameId as string | undefined;
      const lensId = req.query.lensId as string | undefined;

      const result = await stockMovementsService.findAll(req.user!.shopId, { frameId, lensId, page, limit });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
