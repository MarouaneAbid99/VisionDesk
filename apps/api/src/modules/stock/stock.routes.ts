import { Router, RequestHandler } from 'express';
import { stockController } from './stock.controller.js';
import { authenticate, requireShopId } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate as RequestHandler);
router.use(requireShopId as RequestHandler);

router.get('/low-stock', stockController.getLowStock as RequestHandler);
router.get('/reorder-suggestions', stockController.getReorderSuggestions as RequestHandler);
router.get('/movements', stockController.getStockMovements as RequestHandler);
router.get('/summary', stockController.getStockSummary as RequestHandler);

export default router;
