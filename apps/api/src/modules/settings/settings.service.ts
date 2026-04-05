import { prisma } from '../../lib/prisma.js';

export const settingsService = {
  async getAll(shopId: string) {
    const settings = await prisma.appSetting.findMany({ where: { shopId } });
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  },

  async get(shopId: string, key: string) {
    const setting = await prisma.appSetting.findUnique({
      where: { shopId_key: { shopId, key } },
    });
    return setting?.value ?? null;
  },

  async set(shopId: string, key: string, value: any) {
    return prisma.appSetting.upsert({
      where: { shopId_key: { shopId, key } },
      update: { value },
      create: { shopId, key, value },
    });
  },

  async delete(shopId: string, key: string) {
    await prisma.appSetting.deleteMany({ where: { shopId, key } });
    return { success: true };
  },
};
