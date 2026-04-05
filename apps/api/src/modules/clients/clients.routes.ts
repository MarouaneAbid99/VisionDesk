import { Router, RequestHandler } from 'express';
import { clientsController } from './clients.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const clientsRouter = Router();

clientsRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

clientsRouter.get('/', clientsController.findAll as RequestHandler);
clientsRouter.get('/:id', clientsController.findById as RequestHandler);
clientsRouter.post('/', clientsController.create as RequestHandler);
clientsRouter.put('/:id', clientsController.update as RequestHandler);
clientsRouter.delete('/:id', clientsController.delete as RequestHandler);
