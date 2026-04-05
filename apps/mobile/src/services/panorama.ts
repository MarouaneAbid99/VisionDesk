import api, { buildAssetUrl } from './api';
import { PanoramaScene, ApiResponse } from '../types';

export const panoramaService = {
  getActiveScene: async (): Promise<PanoramaScene | null> => {
    const response = await api.get<ApiResponse<PanoramaScene | null>>('/panorama/active-scene');
    const scene = response.data.data;
    
    // Transform imageUrl to full URL using centralized asset URL builder
    if (scene) {
      return {
        ...scene,
        imageUrl: buildAssetUrl(scene.imageUrl) || scene.imageUrl,
      };
    }
    
    return scene;
  },
};
