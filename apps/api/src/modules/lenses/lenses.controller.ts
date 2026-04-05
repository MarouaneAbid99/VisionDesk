import { Response, NextFunction } from 'express';
import { lensesService } from './lenses.service.js';
import { lensRecommendationService } from './lensRecommendation.service.js';
import { createLensSchema, updateLensSchema, lensQuerySchema, lensRecommendationSchema } from './lenses.schema.js';
import { AuthRequest } from '../../middleware/auth.js';

export const lensesController = {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = lensQuerySchema.parse(req.query);
      const result = await lensesService.findAll(req.user!.shopId, query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lens = await lensesService.findById(req.params.id, req.user!.shopId);
      res.json({ success: true, data: lens });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createLensSchema.parse(req.body);
      const lens = await lensesService.create(req.user!.shopId, input);
      res.status(201).json({ success: true, data: lens });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateLensSchema.parse(req.body);
      const lens = await lensesService.update(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: lens });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await lensesService.delete(req.params.id, req.user!.shopId);
      res.json({ success: true, message: 'Lens deleted' });
    } catch (error) {
      next(error);
    }
  },

  async recommend(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = lensRecommendationSchema.parse(req.body);
      const recommendations = await lensRecommendationService.recommend(req.user!.shopId, input);
      res.json({ success: true, data: { recommendations } });
    } catch (error) {
      next(error);
    }
  },
};
