import { Response, NextFunction } from 'express';
import { atelierService } from './atelier.service.js';
import { updateAtelierJobSchema, updateAtelierJobStatusSchema, atelierQuerySchema } from './atelier.schema.js';
import { AuthRequest } from '../../middleware/auth.js';

export const atelierController = {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = atelierQuerySchema.parse(req.query);
      const result = await atelierService.findAll(req.user!.shopId, query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const job = await atelierService.findById(req.params.id, req.user!.shopId);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateAtelierJobSchema.parse(req.body);
      const job = await atelierService.update(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateAtelierJobStatusSchema.parse(req.body);
      const job = await atelierService.updateStatus(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  },
};
