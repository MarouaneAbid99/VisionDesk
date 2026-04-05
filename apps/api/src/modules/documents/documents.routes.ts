import { Router, RequestHandler } from 'express';
import { documentsController } from './documents.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const documentsRouter = Router();

documentsRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

documentsRouter.get('/orders/:id/pdf', documentsController.getOrderPdf as RequestHandler);
documentsRouter.get('/orders/:id/pickup-slip', documentsController.getPickupSlip as RequestHandler);
documentsRouter.get('/prescriptions/:id/pdf', documentsController.getPrescriptionPdf as RequestHandler);
documentsRouter.get('/clients/:id/summary', documentsController.getClientSummary as RequestHandler);
