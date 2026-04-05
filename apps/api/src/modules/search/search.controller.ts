import { Response, NextFunction } from 'express';
import { searchService } from './search.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export const searchController = {
  async globalSearch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string) || 5;
      const results = await searchService.globalSearch(req.user!.shopId, query, limit);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  },
};
