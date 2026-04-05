import { Router, RequestHandler } from 'express';
import { atelierController } from './atelier.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const atelierRouter = Router();

atelierRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

atelierRouter.get('/jobs', atelierController.findAll as RequestHandler);
atelierRouter.get('/jobs/:id', atelierController.findById as RequestHandler);
atelierRouter.put('/jobs/:id', atelierController.update as RequestHandler);
atelierRouter.patch('/jobs/:id/status', atelierController.updateStatus as RequestHandler);
