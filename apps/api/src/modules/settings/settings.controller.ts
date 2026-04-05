import { Response, NextFunction } from 'express';
import { settingsService } from './settings.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export const settingsController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getAll(req.user!.shopId);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  },

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const value = await settingsService.get(req.user!.shopId, req.params.key);
      res.json({ success: true, data: value });
    } catch (error) {
      next(error);
    }
  },

  async set(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const setting = await settingsService.set(req.user!.shopId, req.params.key, req.body.value);
      res.json({ success: true, data: setting });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await settingsService.delete(req.user!.shopId, req.params.key);
      res.json({ success: true, message: 'Setting deleted' });
    } catch (error) {
      next(error);
    }
  },
};
