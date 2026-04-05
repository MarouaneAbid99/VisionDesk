import { Response, NextFunction } from 'express';
import { usersService } from './users.service.js';
import { createUserSchema, updateUserSchema } from './users.schema.js';
import { AuthRequest } from '../../middleware/auth.js';

export const usersController = {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await usersService.findAll(req.user!.shopId);
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.findById(req.params.id, req.user!.shopId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createUserSchema.parse(req.body);
      const user = await usersService.create(req.user!.shopId, input);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateUserSchema.parse(req.body);
      const user = await usersService.update(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await usersService.delete(req.params.id, req.user!.shopId);
      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  },
};
