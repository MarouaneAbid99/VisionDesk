import { Router, RequestHandler } from 'express';
import { searchController } from './search.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const searchRouter = Router();

searchRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

searchRouter.get('/', searchController.globalSearch as RequestHandler);
