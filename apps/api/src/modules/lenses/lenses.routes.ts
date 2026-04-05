import { Router, RequestHandler } from 'express';
import { lensesController } from './lenses.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const lensesRouter = Router();

lensesRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

lensesRouter.get('/', lensesController.findAll as RequestHandler);
lensesRouter.post('/recommend', lensesController.recommend as RequestHandler);
lensesRouter.get('/:id', lensesController.findById as RequestHandler);
lensesRouter.post('/', lensesController.create as RequestHandler);
lensesRouter.put('/:id', lensesController.update as RequestHandler);
lensesRouter.delete('/:id', lensesController.delete as RequestHandler);
