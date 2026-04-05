import { Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';
import { notificationsQuerySchema } from './notifications.schema.js';
import { AuthRequest } from '../../middleware/auth.js';

export const notificationsController = {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = notificationsQuerySchema.parse(req.query);
      const result = await notificationsService.findAll(req.user!.shopId, req.user!.id, query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await notificationsService.getUnreadCount(req.user!.shopId, req.user!.id);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notification = await notificationsService.markAsRead(
        req.params.id,
        req.user!.shopId,
        req.user!.id
      );
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await notificationsService.markAllAsRead(req.user!.shopId, req.user!.id);
      res.json({ success: true, data: { markedCount: count } });
    } catch (error) {
      next(error);
    }
  },
};
