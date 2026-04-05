import { Response, NextFunction } from 'express';
import { activityLogsService } from './activity-logs.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export const activityLogsController = {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = req.query.userId as string | undefined;
      const action = req.query.action as string | undefined;

      const result = await activityLogsService.findAll(req.user!.shopId, { userId, action, page, limit });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
