import { Response, NextFunction } from 'express';
import { panoramaService } from '../panorama/panorama.service.js';
import {
  createHotspotSchema,
  updateHotspotSchema,
  createSceneSchema,
  updateSceneSchema,
  updateHotspotPositionSchema,
  updateHotspotStatusSchema,
} from '../panorama/panorama.schema.js';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errorHandler.js';
import { PANORAMA_URL_PREFIX } from '../../middleware/upload.js';
import { prisma } from '../../lib/prisma.js';

async function validateShopExists(shopId: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) {
    throw new AppError(404, 'Shop not found');
  }
  return shop;
}

export const superadminPanoramaController = {
  // ============================================
  // SCENE ENDPOINTS
  // ============================================

  async getShopPanorama(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      await validateShopExists(shopId);
      
      const scene = await panoramaService.getActiveScene(shopId);
      res.json({ success: true, data: scene });
    } catch (error) {
      next(error);
    }
  },

  async getShopScenes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      await validateShopExists(shopId);
      
      const scenes = await panoramaService.getScenes(shopId);
      res.json({ success: true, data: scenes });
    } catch (error) {
      next(error);
    }
  },

  async uploadShopScene(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      await validateShopExists(shopId);

      if (!req.file) {
        throw new AppError(400, 'No image file provided');
      }

      const input = createSceneSchema.parse({
        name: req.body.name || 'Main Panorama',
        isActive: req.body.isActive === 'true' || req.body.isActive === true,
      });

      const imageUrl = `${PANORAMA_URL_PREFIX}/${req.file.filename}`;
      const scene = await panoramaService.createScene(shopId, input, imageUrl);
      res.status(201).json({ success: true, data: scene });
    } catch (error) {
      next(error);
    }
  },

  async updateShopScene(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, sceneId } = req.params;
      await validateShopExists(shopId);

      const input = updateSceneSchema.parse(req.body);
      const imageUrl = req.file ? `${PANORAMA_URL_PREFIX}/${req.file.filename}` : undefined;
      const scene = await panoramaService.updateScene(sceneId, shopId, input, imageUrl);
      res.json({ success: true, data: scene });
    } catch (error) {
      next(error);
    }
  },

  async deleteShopScene(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, sceneId } = req.params;
      await validateShopExists(shopId);

      await panoramaService.deleteScene(sceneId, shopId);
      res.json({ success: true, message: 'Scene deleted' });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // HOTSPOT ENDPOINTS
  // ============================================

  async getShopHotspots(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      await validateShopExists(shopId);

      const sceneId = req.query.sceneId as string | undefined;
      const hotspots = await panoramaService.getHotspots(shopId, sceneId);
      res.json({ success: true, data: hotspots });
    } catch (error) {
      next(error);
    }
  },

  async createShopHotspot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      await validateShopExists(shopId);

      const input = createHotspotSchema.parse(req.body);
      const hotspot = await panoramaService.createHotspot(shopId, input);
      res.status(201).json({ success: true, data: hotspot });
    } catch (error) {
      next(error);
    }
  },

  async updateShopHotspot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, id } = req.params;
      await validateShopExists(shopId);

      const input = updateHotspotSchema.parse(req.body);
      const hotspot = await panoramaService.updateHotspot(id, shopId, input);
      res.json({ success: true, data: hotspot });
    } catch (error) {
      next(error);
    }
  },

  async updateShopHotspotPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, id } = req.params;
      await validateShopExists(shopId);

      const input = updateHotspotPositionSchema.parse(req.body);
      const hotspot = await panoramaService.updateHotspotPosition(id, shopId, input);
      res.json({ success: true, data: hotspot });
    } catch (error) {
      next(error);
    }
  },

  async updateShopHotspotStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, id } = req.params;
      await validateShopExists(shopId);

      const input = updateHotspotStatusSchema.parse(req.body);
      const hotspot = await panoramaService.updateHotspotStatus(id, shopId, input);
      res.json({ success: true, data: hotspot });
    } catch (error) {
      next(error);
    }
  },

  async deleteShopHotspot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, id } = req.params;
      await validateShopExists(shopId);

      await panoramaService.deleteHotspot(id, shopId);
      res.json({ success: true, message: 'Hotspot deleted' });
    } catch (error) {
      next(error);
    }
  },
};
