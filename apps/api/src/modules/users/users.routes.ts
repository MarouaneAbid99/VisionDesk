import { Router, RequestHandler } from 'express';
import { usersController } from './users.controller.js';
import { authenticate, isAdminOrOwner, isShopUser } from '../../middleware/auth.js';

export const usersRouter = Router();

usersRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);
usersRouter.use(isAdminOrOwner as RequestHandler);

usersRouter.get('/', usersController.findAll as RequestHandler);
usersRouter.get('/:id', usersController.findById as RequestHandler);
usersRouter.post('/', usersController.create as RequestHandler);
usersRouter.put('/:id', usersController.update as RequestHandler);
usersRouter.delete('/:id', usersController.delete as RequestHandler);
