import { Response, NextFunction } from 'express';
import { suppliersService } from './suppliers.service.js';
import { supplierBusinessService } from './supplierBusiness.service.js';
import { createSupplierSchema, updateSupplierSchema } from './suppliers.schema.js';
import { AuthRequest } from '../../middleware/auth.js';
import logger from '../../lib/logger.js';

export const suppliersController = {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const shopId = req.user!.shopId;
      const suppliers = await suppliersService.findAll(shopId);
      logger.debug({ shopId, count: suppliers.length }, 'GET /suppliers');
      res.json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  },

  async getBusinessMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || 'month';
      const allowed = ['today', 'week', 'month', 'year', 'all'];
      const p = allowed.includes(period) ? (period as 'today' | 'week' | 'month' | 'year' | 'all') : 'month';
      await suppliersService.findById(req.params.id, req.user!.shopId);
      const data = await supplierBusinessService.getMetrics(req.params.id, req.user!.shopId, p);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const supplier = await suppliersService.findById(req.params.id, req.user!.shopId);
      res.json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createSupplierSchema.parse(req.body);
      const supplier = await suppliersService.create(req.user!.shopId, input);
      res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateSupplierSchema.parse(req.body);
      const supplier = await suppliersService.update(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await suppliersService.delete(req.params.id, req.user!.shopId);
      res.json({ success: true, message: 'Supplier deleted' });
    } catch (error) {
      next(error);
    }
  },
};
