import { Request, Response, NextFunction } from 'express';
import { shopsService } from './shops.service.js';

export const shopsController = {
  async findAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const shops = await shopsService.findAll();
      res.json({ success: true, data: shops });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await shopsService.findById(req.params.id);
      res.json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await shopsService.create(req.body);
      res.status(201).json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await shopsService.update(req.params.id, req.body);
      res.json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await shopsService.delete(req.params.id);
      res.json({ success: true, message: 'Shop deleted' });
    } catch (error) {
      next(error);
    }
  },
};
