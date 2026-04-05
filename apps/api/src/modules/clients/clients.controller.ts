import { Response, NextFunction } from 'express';
import { clientsService } from './clients.service.js';
import { createClientSchema, updateClientSchema, clientQuerySchema } from './clients.schema.js';
import { AuthRequest } from '../../middleware/auth.js';

export const clientsController = {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = clientQuerySchema.parse(req.query);
      const result = await clientsService.findAll(req.user!.shopId, query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const client = await clientsService.findById(req.params.id, req.user!.shopId);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createClientSchema.parse(req.body);
      const client = await clientsService.create(req.user!.shopId, input);
      res.status(201).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateClientSchema.parse(req.body);
      const client = await clientsService.update(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await clientsService.delete(req.params.id, req.user!.shopId);
      res.json({ success: true, message: 'Client deleted' });
    } catch (error) {
      next(error);
    }
  },
};
