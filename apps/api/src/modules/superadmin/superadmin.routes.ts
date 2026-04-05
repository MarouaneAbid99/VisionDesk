import { Router, RequestHandler } from 'express';
import { superadminController } from './superadmin.controller.js';
import { superadminPanoramaController } from './superadmin-panorama.controller.js';
import { authenticate, isSuperAdmin } from '../../middleware/auth.js';
import { uploadPanorama } from '../../middleware/upload.js';

export const superadminRouter = Router();

// Auth routes (no auth required for login)
superadminRouter.post('/auth/login', superadminController.login as RequestHandler);

// Protected routes (require superadmin auth)
superadminRouter.use(authenticate as RequestHandler, isSuperAdmin as RequestHandler);

superadminRouter.get('/auth/me', superadminController.getMe as RequestHandler);

// Dashboard
superadminRouter.get('/dashboard/summary', superadminController.getDashboardSummary as RequestHandler);

// Shops
superadminRouter.get('/shops', superadminController.findAllShops as RequestHandler);
superadminRouter.get('/shops/:id', superadminController.findShopById as RequestHandler);
superadminRouter.post('/shops', superadminController.createShop as RequestHandler);
superadminRouter.put('/shops/:id', superadminController.updateShop as RequestHandler);
superadminRouter.patch('/shops/:id/status', superadminController.updateShopStatus as RequestHandler);

// Shop Panorama Management
superadminRouter.get('/shops/:shopId/panorama', superadminPanoramaController.getShopPanorama as RequestHandler);
superadminRouter.get('/shops/:shopId/panorama/scenes', superadminPanoramaController.getShopScenes as RequestHandler);
superadminRouter.post('/shops/:shopId/panorama/upload', uploadPanorama, superadminPanoramaController.uploadShopScene as RequestHandler);
superadminRouter.put('/shops/:shopId/panorama/scenes/:sceneId', uploadPanorama, superadminPanoramaController.updateShopScene as RequestHandler);
superadminRouter.delete('/shops/:shopId/panorama/scenes/:sceneId', superadminPanoramaController.deleteShopScene as RequestHandler);
superadminRouter.get('/shops/:shopId/panorama/hotspots', superadminPanoramaController.getShopHotspots as RequestHandler);
superadminRouter.post('/shops/:shopId/panorama/hotspots', superadminPanoramaController.createShopHotspot as RequestHandler);
superadminRouter.put('/shops/:shopId/panorama/hotspots/:id', superadminPanoramaController.updateShopHotspot as RequestHandler);
superadminRouter.patch('/shops/:shopId/panorama/hotspots/:id/position', superadminPanoramaController.updateShopHotspotPosition as RequestHandler);
superadminRouter.patch('/shops/:shopId/panorama/hotspots/:id/status', superadminPanoramaController.updateShopHotspotStatus as RequestHandler);
superadminRouter.delete('/shops/:shopId/panorama/hotspots/:id', superadminPanoramaController.deleteShopHotspot as RequestHandler);

// Users
superadminRouter.get('/users', superadminController.findAllUsers as RequestHandler);
superadminRouter.get('/users/:id', superadminController.findUserById as RequestHandler);
superadminRouter.patch('/users/:id/status', superadminController.updateUserStatus as RequestHandler);

// Activity Logs
superadminRouter.get('/activity-logs', superadminController.findAllActivityLogs as RequestHandler);

// Platform Settings
superadminRouter.get('/settings', superadminController.getPlatformSettings as RequestHandler);
superadminRouter.put('/settings', superadminController.updatePlatformSettings as RequestHandler);
