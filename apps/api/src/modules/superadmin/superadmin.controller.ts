import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { superadminService } from './superadmin.service.js';
import {
  superadminLoginSchema,
  createShopSchema,
  updateShopSchema,
  shopQuerySchema,
  usersQuerySchema,
  activityLogsQuerySchema,
  updatePlatformSettingsSchema,
} from './superadmin.schema.js';

export const superadminController = {
  // ============================================
  // AUTH
  // ============================================
  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = superadminLoginSchema.parse(req.body);
      const result = await superadminService.login(input);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await superadminService.getMe(req.user!.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // DASHBOARD
  // ============================================
  async getDashboardSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const summary = await superadminService.getDashboardSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // SHOPS
  // ============================================
  async findAllShops(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = shopQuerySchema.parse(req.query);
      const result = await superadminService.findAllShops(query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findShopById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const shop = await superadminService.findShopById(req.params.id);
      res.json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  },

  async createShop(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createShopSchema.parse(req.body);
      const shop = await superadminService.createShop(input);
      res.status(201).json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  },

  async updateShop(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateShopSchema.parse(req.body);
      const shop = await superadminService.updateShop(req.params.id, input);
      res.json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  },

  async updateShopStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
      }
      const shop = await superadminService.updateShopStatus(req.params.id, isActive);
      res.json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // USERS
  // ============================================
  async findAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = usersQuerySchema.parse(req.query);
      const result = await superadminService.findAllUsers(query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await superadminService.findUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
      }
      const user = await superadminService.updateUserStatus(req.params.id, isActive);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // ACTIVITY LOGS
  // ============================================
  async findAllActivityLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = activityLogsQuerySchema.parse(req.query);
      const result = await superadminService.findAllActivityLogs(query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // PLATFORM SETTINGS
  // ============================================
  async getPlatformSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await superadminService.getPlatformSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  },

  async updatePlatformSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updatePlatformSettingsSchema.parse(req.body);
      const settings = await superadminService.updatePlatformSettings(input);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  },
};
