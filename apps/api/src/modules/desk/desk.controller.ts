import { Response, NextFunction } from 'express';
import { deskService } from './desk.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export const deskController = {
  async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const summary = await deskService.getSummary(req.user!.shopId);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },

  async getRecentOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await deskService.getRecentOrders(req.user!.shopId, limit);
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  },

  async getLowStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lowStock = await deskService.getLowStock(req.user!.shopId);
      res.json({ success: true, data: lowStock });
    } catch (error) {
      next(error);
    }
  },

  async getAtelierQueue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const queue = await deskService.getAtelierQueue(req.user!.shopId);
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  },

  async getUpcomingAppointments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const appointments = await deskService.getUpcomingAppointments(req.user!.shopId, limit);
      res.json({ success: true, data: appointments });
    } catch (error) {
      next(error);
    }
  },

  async getTodayAppointments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const appointments = await deskService.getTodayAppointments(req.user!.shopId);
      res.json({ success: true, data: appointments });
    } catch (error) {
      next(error);
    }
  },

  async getReadyForPickup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orders = await deskService.getReadyForPickup(req.user!.shopId);
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  },

  async getOverdueOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orders = await deskService.getOverdueOrders(req.user!.shopId);
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  },

  async getDelayedAtelierJobs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const jobs = await deskService.getDelayedAtelierJobs(req.user!.shopId);
      res.json({ success: true, data: jobs });
    } catch (error) {
      next(error);
    }
  },

  async getOrdersAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await deskService.getOrdersAnalytics(req.user!.shopId);
      res.json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  },

  async getBestSellers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const bestSellers = await deskService.getBestSellers(req.user!.shopId, limit);
      res.json({ success: true, data: bestSellers });
    } catch (error) {
      next(error);
    }
  },

  async getBusinessIntelligence(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const intelligence = await deskService.getBusinessIntelligence(req.user!.shopId);
      res.json({ success: true, data: intelligence });
    } catch (error) {
      next(error);
    }
  },
};
