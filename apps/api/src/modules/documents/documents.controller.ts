import { Response, NextFunction } from 'express';
import { documentsService } from './documents.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export const documentsController = {
  async getOrderPdf(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await documentsService.getOrderData(req.params.id, req.user!.shopId);
      const html = documentsService.generateOrderPdfHtml(order);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      next(error);
    }
  },

  async getPrescriptionPdf(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prescription = await documentsService.getPrescriptionData(req.params.id, req.user!.shopId);
      const html = documentsService.generatePrescriptionPdfHtml(prescription);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      next(error);
    }
  },

  async getPickupSlip(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await documentsService.getOrderData(req.params.id, req.user!.shopId);
      const html = documentsService.generatePickupSlipHtml(order);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      next(error);
    }
  },

  async getClientSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const client = await documentsService.getClientData(req.params.id, req.user!.shopId);
      const html = documentsService.generateClientSummaryHtml(client);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      next(error);
    }
  },
};
