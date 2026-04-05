import { Router, RequestHandler } from 'express';
import { shopsController } from './shops.controller.js';
import { authenticate, isSuperAdmin } from '../../middleware/auth.js';

export const shopsRouter = Router();

shopsRouter.use(authenticate as RequestHandler);
shopsRouter.use(isSuperAdmin as RequestHandler);

shopsRouter.get('/', shopsController.findAll as RequestHandler);
shopsRouter.get('/:id', shopsController.findById as RequestHandler);
shopsRouter.post('/', shopsController.create as RequestHandler);
shopsRouter.put('/:id', shopsController.update as RequestHandler);
shopsRouter.delete('/:id', shopsController.delete as RequestHandler);
