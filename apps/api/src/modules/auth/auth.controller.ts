import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { loginSchema } from './auth.schema.js';
import { AuthRequest } from '../../middleware/auth.js';
import logger from '../../lib/logger.js';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    logger.info({ email: req.body?.email }, 'Login attempt');
    try {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(input);
      logger.info({ email: input.email }, 'Login success');
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error({ err: error, email: req.body?.email }, 'Login error');
      next(error);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
};
