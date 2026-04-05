import { Router, RequestHandler } from 'express';
import { appointmentsController } from './appointments.controller.js';
import { authenticate, requireShopId } from '../../middleware/auth.js';

export const appointmentsRouter = Router();

appointmentsRouter.use(authenticate as RequestHandler);
appointmentsRouter.use(requireShopId as RequestHandler);

appointmentsRouter.get('/', appointmentsController.findAll as RequestHandler);
appointmentsRouter.get('/upcoming', appointmentsController.findUpcoming as RequestHandler);
appointmentsRouter.get('/:id', appointmentsController.findById as RequestHandler);
appointmentsRouter.post('/', appointmentsController.create as RequestHandler);
appointmentsRouter.put('/:id', appointmentsController.update as RequestHandler);
appointmentsRouter.patch('/:id/status', appointmentsController.updateStatus as RequestHandler);
appointmentsRouter.delete('/:id', appointmentsController.delete as RequestHandler);
