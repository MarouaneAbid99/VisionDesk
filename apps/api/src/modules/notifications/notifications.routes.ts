import { Router, RequestHandler } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

notificationsRouter.get('/', notificationsController.findAll as RequestHandler);
notificationsRouter.get('/unread-count', notificationsController.getUnreadCount as RequestHandler);
notificationsRouter.patch('/:id/read', notificationsController.markAsRead as RequestHandler);
notificationsRouter.patch('/read-all', notificationsController.markAllAsRead as RequestHandler);
