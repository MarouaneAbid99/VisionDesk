import { Router, RequestHandler } from 'express';
import { suppliersController } from './suppliers.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const suppliersRouter = Router();

suppliersRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

suppliersRouter.get('/', suppliersController.findAll as RequestHandler);
suppliersRouter.get('/:id/business-metrics', suppliersController.getBusinessMetrics as RequestHandler);
suppliersRouter.get('/:id', suppliersController.findById as RequestHandler);
suppliersRouter.post('/', suppliersController.create as RequestHandler);
suppliersRouter.put('/:id', suppliersController.update as RequestHandler);
suppliersRouter.delete('/:id', suppliersController.delete as RequestHandler);
