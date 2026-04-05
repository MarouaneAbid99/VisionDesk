import { Router, RequestHandler } from 'express';
import { ordersController } from './orders.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const ordersRouter = Router();

ordersRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

ordersRouter.get('/', ordersController.findAll as RequestHandler);
ordersRouter.get('/:id', ordersController.findById as RequestHandler);
ordersRouter.post('/', ordersController.create as RequestHandler);
ordersRouter.put('/:id', ordersController.update as RequestHandler);
ordersRouter.patch('/:id/status', ordersController.updateStatus as RequestHandler);
ordersRouter.post('/:id/payment', ordersController.addPayment as RequestHandler);
ordersRouter.get('/:id/invoice', ordersController.getInvoice as RequestHandler);
ordersRouter.get('/:id/payments', ordersController.getPaymentHistory as RequestHandler);
ordersRouter.delete('/:id', ordersController.delete as RequestHandler);
