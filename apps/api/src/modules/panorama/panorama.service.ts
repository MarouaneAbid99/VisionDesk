import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateHotspotInput,
  UpdateHotspotInput,
  CreateSceneInput,
  UpdateSceneInput,
  UpdateHotspotPositionInput,
  UpdateHotspotStatusInput,
} from './panorama.schema.js';
import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR } from '../../middleware/upload.js';

export const panoramaService = {
  // ============================================
  // SCENE METHODS
  // ============================================

  async getActiveScene(shopId: string) {
    const scene = await prisma.panoramaScene.findFirst({
      where: { shopId, isActive: true },
      include: {
        hotspots: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return scene;
  },

  async getScenes(shopId: string) {
    return prisma.panoramaScene.findMany({
      where: { shopId },
      include: {
        hotspots: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getSceneById(id: string, shopId: string) {
    const scene = await prisma.panoramaScene.findFirst({
      where: { id, shopId },
      include: {
        hotspots: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!scene) {
      throw new AppError(404, 'Scene not found');
    }

    return scene;
  },

  async createScene(shopId: string, input: CreateSceneInput, imageUrl: string) {
    // If this scene is active, deactivate other scenes
    if (input.isActive !== false) {
      await prisma.panoramaScene.updateMany({
        where: { shopId, isActive: true },
        data: { isActive: false },
      });
    }

    return prisma.panoramaScene.create({
      data: {
        shopId,
        name: input.name,
        imageUrl,
        isActive: input.isActive ?? true,
      },
      include: {
        hotspots: true,
      },
    });
  },

  async updateScene(id: string, shopId: string, input: UpdateSceneInput, imageUrl?: string) {
    const scene = await prisma.panoramaScene.findFirst({
      where: { id, shopId },
    });

    if (!scene) {
      throw new AppError(404, 'Scene not found');
    }

    // If activating this scene, deactivate others
    if (input.isActive === true) {
      await prisma.panoramaScene.updateMany({
        where: { shopId, isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    // Delete old image if replacing
    if (imageUrl && scene.imageUrl) {
      const oldImagePath = path.join(UPLOAD_DIR, 'panoramas', path.basename(scene.imageUrl));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    return prisma.panoramaScene.update({
      where: { id },
      data: {
        ...input,
        ...(imageUrl && { imageUrl }),
      },
      include: {
        hotspots: true,
      },
    });
  },

  async deleteScene(id: string, shopId: string) {
    const scene = await prisma.panoramaScene.findFirst({
      where: { id, shopId },
    });

    if (!scene) {
      throw new AppError(404, 'Scene not found');
    }

    // Delete image file
    if (scene.imageUrl) {
      const imagePath = path.join(UPLOAD_DIR, 'panoramas', path.basename(scene.imageUrl));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.panoramaScene.delete({ where: { id } });
    return { success: true };
  },

  // ============================================
  // HOTSPOT METHODS
  // ============================================

  async getHotspots(shopId: string, sceneId?: string) {
    return prisma.panoramaHotspot.findMany({
      where: {
        shopId,
        ...(sceneId && { sceneId }),
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async getHotspotById(id: string, shopId: string) {
    const hotspot = await prisma.panoramaHotspot.findFirst({
      where: { id, shopId },
    });

    if (!hotspot) {
      throw new AppError(404, 'Hotspot not found');
    }

    return hotspot;
  },

  async createHotspot(shopId: string, input: CreateHotspotInput) {
    const scene = await prisma.panoramaScene.findFirst({
      where: { id: input.sceneId, shopId },
    });

    if (!scene) {
      throw new AppError(404, 'Scene not found');
    }

    // Get max sort order
    const maxSortOrder = await prisma.panoramaHotspot.aggregate({
      where: { sceneId: input.sceneId },
      _max: { sortOrder: true },
    });

    return prisma.panoramaHotspot.create({
      data: {
        shopId,
        sceneId: input.sceneId,
        moduleKey: input.moduleKey,
        label: input.label,
        x: input.x,
        y: input.y,
        w: input.w ?? 0.1,
        h: input.h ?? 0.1,
        icon: input.icon,
        sortOrder: input.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1,
        isActive: input.isActive ?? true,
      },
    });
  },

  async updateHotspot(id: string, shopId: string, input: UpdateHotspotInput) {
    const hotspot = await prisma.panoramaHotspot.findFirst({
      where: { id, shopId },
    });

    if (!hotspot) {
      throw new AppError(404, 'Hotspot not found');
    }

    return prisma.panoramaHotspot.update({
      where: { id },
      data: input,
    });
  },

  async updateHotspotPosition(id: string, shopId: string, input: UpdateHotspotPositionInput) {
    const hotspot = await prisma.panoramaHotspot.findFirst({
      where: { id, shopId },
    });

    if (!hotspot) {
      throw new AppError(404, 'Hotspot not found');
    }

    return prisma.panoramaHotspot.update({
      where: { id },
      data: {
        x: input.x,
        y: input.y,
        ...(input.w !== undefined && { w: input.w }),
        ...(input.h !== undefined && { h: input.h }),
      },
    });
  },

  async updateHotspotStatus(id: string, shopId: string, input: UpdateHotspotStatusInput) {
    const hotspot = await prisma.panoramaHotspot.findFirst({
      where: { id, shopId },
    });

    if (!hotspot) {
      throw new AppError(404, 'Hotspot not found');
    }

    return prisma.panoramaHotspot.update({
      where: { id },
      data: { isActive: input.isActive },
    });
  },

  async deleteHotspot(id: string, shopId: string) {
    const hotspot = await prisma.panoramaHotspot.findFirst({
      where: { id, shopId },
    });

    if (!hotspot) {
      throw new AppError(404, 'Hotspot not found');
    }

    await prisma.panoramaHotspot.delete({ where: { id } });
    return { success: true };
  },
};
