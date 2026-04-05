import { Router, RequestHandler } from 'express';
import { panoramaController } from './panorama.controller.js';
import { authenticate, isAdminOrOwner, isShopUser } from '../../middleware/auth.js';
import { uploadPanorama } from '../../middleware/upload.js';

export const panoramaRouter = Router();

panoramaRouter.use(authenticate as RequestHandler, isShopUser as RequestHandler);

// Scene routes
panoramaRouter.get('/active-scene', panoramaController.getActiveScene as RequestHandler);
panoramaRouter.get('/scenes', panoramaController.getScenes as RequestHandler);
panoramaRouter.get('/scenes/:id', panoramaController.getSceneById as RequestHandler);
panoramaRouter.post('/scenes/upload', isAdminOrOwner as RequestHandler, uploadPanorama, panoramaController.uploadScene as RequestHandler);
panoramaRouter.put('/scenes/:id', isAdminOrOwner as RequestHandler, uploadPanorama, panoramaController.updateScene as RequestHandler);
panoramaRouter.delete('/scenes/:id', isAdminOrOwner as RequestHandler, panoramaController.deleteScene as RequestHandler);

// Hotspot routes
panoramaRouter.get('/hotspots', panoramaController.getHotspots as RequestHandler);
panoramaRouter.post('/hotspots', isAdminOrOwner as RequestHandler, panoramaController.createHotspot as RequestHandler);
panoramaRouter.put('/hotspots/:id', isAdminOrOwner as RequestHandler, panoramaController.updateHotspot as RequestHandler);
panoramaRouter.patch('/hotspots/:id/position', isAdminOrOwner as RequestHandler, panoramaController.updateHotspotPosition as RequestHandler);
panoramaRouter.patch('/hotspots/:id/status', isAdminOrOwner as RequestHandler, panoramaController.updateHotspotStatus as RequestHandler);
panoramaRouter.delete('/hotspots/:id', isAdminOrOwner as RequestHandler, panoramaController.deleteHotspot as RequestHandler);

// Utility routes
panoramaRouter.get('/module-keys', panoramaController.getModuleKeys as RequestHandler);
