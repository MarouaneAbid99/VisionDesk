import { Router, RequestHandler } from 'express';
import { stockMovementsController } from './stock-movements.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const stockMovementsRouter = Router();

stockMovementsRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);
stockMovementsRouter.get('/', stockMovementsController.findAll as RequestHandler);
