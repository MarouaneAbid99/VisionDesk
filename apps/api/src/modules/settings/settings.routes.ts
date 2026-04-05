import { Router, RequestHandler } from 'express';
import { settingsController } from './settings.controller.js';
import { authenticate, isAdminOrOwner, isShopUser } from '../../middleware/auth.js';

export const settingsRouter = Router();

settingsRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

settingsRouter.get('/', settingsController.getAll as RequestHandler);
settingsRouter.get('/:key', settingsController.get as RequestHandler);
settingsRouter.put('/:key', isAdminOrOwner as RequestHandler, settingsController.set as RequestHandler);
settingsRouter.delete('/:key', isAdminOrOwner as RequestHandler, settingsController.delete as RequestHandler);
