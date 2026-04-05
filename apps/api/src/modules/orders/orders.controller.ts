import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ordersService } from './orders.service.js';
import { invoiceService } from './invoice.service.js';
import { createOrderSchema, updateOrderSchema, updateOrderStatusSchema, orderQuerySchema } from './orders.schema.js';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';

const addPaymentSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
});

export const ordersController = {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = orderQuerySchema.parse(req.query);
      const result = await ordersService.findAll(req.user!.shopId, query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.findById(req.params.id, req.user!.shopId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createOrderSchema.parse(req.body);
      const order = await ordersService.create(req.user!.shopId, req.user!.id, input);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateOrderSchema.parse(req.body);
      const order = await ordersService.update(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateOrderStatusSchema.parse(req.body);
      const order = await ordersService.updateStatus(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ordersService.delete(req.params.id, req.user!.shopId);
      res.json({ success: true, message: 'Order deleted' });
    } catch (error) {
      next(error);
    }
  },

  async addPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Authentification requise pour enregistrer un paiement');
      }
      const { amount } = addPaymentSchema.parse(req.body);
      const order = await ordersService.addPayment(req.params.id, req.user.shopId, amount, req.user.id);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  async getPaymentHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payments = await ordersService.getPaymentHistory(req.params.id, req.user!.shopId);
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  },

  async getInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoiceData = await invoiceService.generateInvoiceData(req.params.id, req.user!.shopId);
      res.json({ success: true, data: invoiceData });
    } catch (error) {
      next(error);
    }
  },
};
