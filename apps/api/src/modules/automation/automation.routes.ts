import { Router, RequestHandler } from 'express';
import { automationController } from './automation.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const automationRouter = Router();

automationRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

automationRouter.post('/run-daily', automationController.runDailyChecks as RequestHandler);
automationRouter.post('/check-appointments', automationController.checkAppointmentReminders as RequestHandler);
automationRouter.post('/check-atelier-delays', automationController.checkAtelierDelays as RequestHandler);
automationRouter.post('/check-low-stock', automationController.checkLowStock as RequestHandler);
