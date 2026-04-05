import { Router, RequestHandler } from 'express';
import { activityLogsController } from './activity-logs.controller.js';
import { authenticate, isAdminOrOwner, isShopUser } from '../../middleware/auth.js';

export const activityLogsRouter = Router();

activityLogsRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);
activityLogsRouter.use(isAdminOrOwner as RequestHandler);

activityLogsRouter.get('/', activityLogsController.findAll as RequestHandler);
