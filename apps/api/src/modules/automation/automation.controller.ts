import { Response, NextFunction } from 'express';
import { automationService } from './automation.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export const automationController = {
  async runDailyChecks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const shopId = req.user!.shopId;
      const results = await automationService.runDailyChecks(shopId);

      res.json({
        success: true,
        data: results,
        message: 'Daily automation checks completed',
      });
    } catch (error) {
      next(error);
    }
  },

  async checkAppointmentReminders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const shopId = req.user!.shopId;
      const count = await automationService.createAppointmentReminders(shopId);

      res.json({
        success: true,
        data: { remindersCreated: count },
      });
    } catch (error) {
      next(error);
    }
  },

  async checkAtelierDelays(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const shopId = req.user!.shopId;
      const results = await automationService.checkAtelierDelays(shopId);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  },

  async checkLowStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const shopId = req.user!.shopId;
      const alertsCreated = await automationService.checkLowStock(shopId);

      res.json({
        success: true,
        data: { alertsCreated },
      });
    } catch (error) {
      next(error);
    }
  },
};
