import { Router, RequestHandler } from 'express';
import { framesController } from './frames.controller.js';
import { authenticate, isShopUser } from '../../middleware/auth.js';

export const framesRouter = Router();

framesRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

framesRouter.get('/', framesController.findAll as RequestHandler);
framesRouter.get('/:id', framesController.findById as RequestHandler);
framesRouter.post('/', framesController.create as RequestHandler);
framesRouter.put('/:id', framesController.update as RequestHandler);
framesRouter.delete('/:id', framesController.delete as RequestHandler);
