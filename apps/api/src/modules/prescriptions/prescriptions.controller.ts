import { Response, NextFunction } from 'express';
import { prescriptionsService } from './prescriptions.service.js';
import { createPrescriptionSchema, updatePrescriptionSchema } from './prescriptions.schema.js';
import { AuthRequest } from '../../middleware/auth.js';

export const prescriptionsController = {
  async findByClient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prescriptions = await prescriptionsService.findByClient(req.params.clientId, req.user!.shopId);
      res.json({ success: true, data: prescriptions });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prescription = await prescriptionsService.findById(req.params.id, req.user!.shopId);
      res.json({ success: true, data: prescription });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createPrescriptionSchema.parse(req.body);
      const prescription = await prescriptionsService.create(req.user!.shopId, input);
      res.status(201).json({ success: true, data: prescription });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updatePrescriptionSchema.parse(req.body);
      const prescription = await prescriptionsService.update(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: prescription });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prescriptionsService.delete(req.params.id, req.user!.shopId);
      res.json({ success: true, message: 'Prescription deleted' });
    } catch (error) {
      next(error);
    }
  },
};
