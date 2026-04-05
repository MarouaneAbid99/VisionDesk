import { Response, NextFunction } from 'express';
import { framesService } from './frames.service.js';
import { createFrameSchema, updateFrameSchema, frameQuerySchema } from './frames.schema.js';
import { AuthRequest } from '../../middleware/auth.js';

export const framesController = {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = frameQuerySchema.parse(req.query);
      const result = await framesService.findAll(req.user!.shopId, query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const frame = await framesService.findById(req.params.id, req.user!.shopId);
      res.json({ success: true, data: frame });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createFrameSchema.parse(req.body);
      const frame = await framesService.create(req.user!.shopId, input);
      res.status(201).json({ success: true, data: frame });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateFrameSchema.parse(req.body);
      const frame = await framesService.update(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: frame });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await framesService.delete(req.params.id, req.user!.shopId);
      res.json({ success: true, message: 'Frame deleted' });
    } catch (error) {
      next(error);
    }
  },
};
