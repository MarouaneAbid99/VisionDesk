import { Router, RequestHandler } from 'express';
import { deskController } from './desk.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const deskRouter = Router();

deskRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

deskRouter.get('/summary', deskController.getSummary as RequestHandler);
deskRouter.get('/recent-orders', deskController.getRecentOrders as RequestHandler);
deskRouter.get('/low-stock', deskController.getLowStock as RequestHandler);
deskRouter.get('/atelier-queue', deskController.getAtelierQueue as RequestHandler);
deskRouter.get('/upcoming-appointments', deskController.getUpcomingAppointments as RequestHandler);
deskRouter.get('/today-appointments', deskController.getTodayAppointments as RequestHandler);
deskRouter.get('/ready-for-pickup', deskController.getReadyForPickup as RequestHandler);
deskRouter.get('/overdue-orders', deskController.getOverdueOrders as RequestHandler);
deskRouter.get('/delayed-atelier', deskController.getDelayedAtelierJobs as RequestHandler);
deskRouter.get('/orders-analytics', deskController.getOrdersAnalytics as RequestHandler);
deskRouter.get('/best-sellers', deskController.getBestSellers as RequestHandler);
deskRouter.get('/business-intelligence', deskController.getBusinessIntelligence as RequestHandler);
