import { Response, NextFunction } from 'express';
import { panoramaService } from './panorama.service.js';
import {
  createHotspotSchema,
  updateHotspotSchema,
  createSceneSchema,
  updateSceneSchema,
  updateHotspotPositionSchema,
  updateHotspotStatusSchema,
  ALLOWED_MODULE_KEYS,
} from './panorama.schema.js';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';
import { PANORAMA_URL_PREFIX } from '../../middleware/upload.js';

export const panoramaController = {
  // ============================================
  // SCENE ENDPOINTS
  // ============================================

  async getActiveScene(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const scene = await panoramaService.getActiveScene(req.user!.shopId);
      res.json({ success: true, data: scene });
    } catch (error) {
      next(error);
    }
  },

  async getScenes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const scenes = await panoramaService.getScenes(req.user!.shopId);
      res.json({ success: true, data: scenes });
    } catch (error) {
      next(error);
    }
  },

  async getSceneById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const scene = await panoramaService.getSceneById(req.params.id, req.user!.shopId);
      res.json({ success: true, data: scene });
    } catch (error) {
      next(error);
    }
  },

  async uploadScene(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'No image file provided');
      }

      const input = createSceneSchema.parse({
        name: req.body.name || 'Main Panorama',
        isActive: req.body.isActive === 'true' || req.body.isActive === true,
      });

      const imageUrl = `${PANORAMA_URL_PREFIX}/${req.file.filename}`;
      const scene = await panoramaService.createScene(req.user!.shopId, input, imageUrl);
      res.status(201).json({ success: true, data: scene });
    } catch (error) {
      next(error);
    }
  },

  async updateScene(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateSceneSchema.parse(req.body);
      const imageUrl = req.file ? `${PANORAMA_URL_PREFIX}/${req.file.filename}` : undefined;
      const scene = await panoramaService.updateScene(req.params.id, req.user!.shopId, input, imageUrl);
      res.json({ success: true, data: scene });
    } catch (error) {
      next(error);
    }
  },

  async deleteScene(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await panoramaService.deleteScene(req.params.id, req.user!.shopId);
      res.json({ success: true, message: 'Scene deleted' });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // HOTSPOT ENDPOINTS
  // ============================================

  async getHotspots(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sceneId = req.query.sceneId as string | undefined;
      const hotspots = await panoramaService.getHotspots(req.user!.shopId, sceneId);
      res.json({ success: true, data: hotspots });
    } catch (error) {
      next(error);
    }
  },

  async createHotspot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createHotspotSchema.parse(req.body);
      const hotspot = await panoramaService.createHotspot(req.user!.shopId, input);
      res.status(201).json({ success: true, data: hotspot });
    } catch (error) {
      next(error);
    }
  },

  async updateHotspot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateHotspotSchema.parse(req.body);
      const hotspot = await panoramaService.updateHotspot(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: hotspot });
    } catch (error) {
      next(error);
    }
  },

  async updateHotspotPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateHotspotPositionSchema.parse(req.body);
      const hotspot = await panoramaService.updateHotspotPosition(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: hotspot });
    } catch (error) {
      next(error);
    }
  },

  async updateHotspotStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateHotspotStatusSchema.parse(req.body);
      const hotspot = await panoramaService.updateHotspotStatus(req.params.id, req.user!.shopId, input);
      res.json({ success: true, data: hotspot });
    } catch (error) {
      next(error);
    }
  },

  async deleteHotspot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await panoramaService.deleteHotspot(req.params.id, req.user!.shopId);
      res.json({ success: true, message: 'Hotspot deleted' });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // UTILITY ENDPOINTS
  // ============================================

  async getModuleKeys(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: ALLOWED_MODULE_KEYS });
    } catch (error) {
      next(error);
    }
  },
};
