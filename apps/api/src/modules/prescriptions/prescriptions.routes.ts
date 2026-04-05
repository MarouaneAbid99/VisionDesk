import { Router, RequestHandler } from 'express';
import { prescriptionsController } from './prescriptions.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const prescriptionsRouter = Router();

prescriptionsRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

prescriptionsRouter.get('/client/:clientId', prescriptionsController.findByClient as RequestHandler);
prescriptionsRouter.get('/:id', prescriptionsController.findById as RequestHandler);
prescriptionsRouter.post('/', prescriptionsController.create as RequestHandler);
prescriptionsRouter.put('/:id', prescriptionsController.update as RequestHandler);
prescriptionsRouter.delete('/:id', prescriptionsController.delete as RequestHandler);
