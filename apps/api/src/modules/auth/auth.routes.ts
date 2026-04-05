import { Router, RequestHandler } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', authController.login as RequestHandler);
authRouter.get('/me', authenticate as RequestHandler, authController.getMe as RequestHandler);
