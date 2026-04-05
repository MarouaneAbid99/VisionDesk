import { Request, Response, NextFunction } from 'express';
import { appointmentsService } from './appointments.service.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentQuerySchema,
} from './appointments.schema.js';

export const appointmentsController = {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = appointmentQuerySchema.parse(req.query);
      const result = await appointmentsService.findAll(req.user!.shopId, query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await appointmentsService.findById(req.params.id, req.user!.shopId);
      res.json({ success: true, data: appointment });
    } catch (error) {
      next(error);
    }
  },

  async findUpcoming(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const appointments = await appointmentsService.findUpcoming(req.user!.shopId, limit);
      res.json({ success: true, data: appointments });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createAppointmentSchema.parse(req.body);
      const appointment = await appointmentsService.create(req.user!.shopId, req.user!.id, input);
      res.status(201).json({ success: true, data: appointment });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateAppointmentSchema.parse(req.body);
      const appointment = await appointmentsService.update(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: appointment });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateAppointmentStatusSchema.parse(req.body);
      const appointment = await appointmentsService.updateStatus(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: appointment });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await appointmentsService.delete(req.params.id, req.user!.shopId);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  },
};
