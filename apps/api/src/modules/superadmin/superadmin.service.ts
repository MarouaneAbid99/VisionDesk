import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  SuperadminLoginInput,
  CreateShopInput,
  UpdateShopInput,
  ShopQuery,
  UsersQuery,
  ActivityLogsQuery,
  UpdatePlatformSettingsInput,
} from './superadmin.schema.js';

const getJwtOptions = (): SignOptions => ({
  expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
});

const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'fallback-secret' || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    return 'development-secret-key-min-32-chars';
  }
  return secret;
};

export const superadminService = {
  // ============================================
  // AUTH
  // ============================================
  async login(input: SuperadminLoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { shop: true },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.role !== 'SUPERADMIN') {
      throw new AppError(403, 'Superadmin access required');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError(401, 'Account is disabled');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, isSuperadmin: true },
      getJWTSecret(),
      getJwtOptions()
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
      },
    });

    if (!user || user.role !== 'SUPERADMIN') {
      throw new AppError(404, 'Superadmin not found');
    }

    return user;
  },

  // ============================================
  // DASHBOARD
  // ============================================
  async getDashboardSummary() {
    const [
      totalShops,
      activeShops,
      totalUsers,
      totalClients,
      totalOrders,
      totalFrames,
      totalLenses,
      recentShops,
      recentActivity,
    ] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.client.count(),
      prisma.order.count(),
      prisma.frame.count(),
      prisma.lens.count(),
      prisma.shop.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true,
          _count: { select: { users: true, orders: true } },
        },
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: { select: { id: true, name: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      stats: {
        totalShops,
        activeShops,
        inactiveShops: totalShops - activeShops,
        totalUsers,
        totalClients,
        totalOrders,
        totalFrames,
        totalLenses,
      },
      recentShops,
      recentActivity,
    };
  },

  // ============================================
  // SHOPS
  // ============================================
  async findAllShops(query: ShopQuery) {
    const { search, isActive, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              orders: true,
              frames: true,
              lenses: true,
            },
          },
        },
      }),
      prisma.shop.count({ where }),
    ]);

    return {
      shops,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async findShopById(id: string) {
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            clients: true,
            orders: true,
            frames: true,
            lenses: true,
            atelierJobs: true,
          },
        },
      },
    });

    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    // Get recent activity for this shop
    const recentActivity = await prisma.activityLog.findMany({
      where: { shopId: id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return { ...shop, recentActivity };
  },

  async createShop(input: CreateShopInput) {
    return prisma.shop.create({
      data: {
        name: input.name,
        address: input.address,
        phone: input.phone,
        email: input.email,
      },
    });
  },

  async updateShop(id: string, input: UpdateShopInput) {
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    return prisma.shop.update({
      where: { id },
      data: input,
    });
  },

  async updateShopStatus(id: string, isActive: boolean) {
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) {
      throw new AppError(404, 'Shop not found');
    }

    return prisma.shop.update({
      where: { id },
      data: { isActive },
    });
  },

  // ============================================
  // USERS
  // ============================================
  async findAllUsers(query: UsersQuery) {
    const { search, shopId, role, isActive, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (shopId) {
      where.shopId = shopId;
    }
    if (role) {
      where.role = role;
    }
    if (isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          shop: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async findUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        shop: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  },

  async updateUserStatus(id: string, isActive: boolean) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Prevent deactivating superadmin
    if (user.role === 'SUPERADMIN' && !isActive) {
      throw new AppError(400, 'Cannot deactivate superadmin user');
    }

    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  },

  // ============================================
  // ACTIVITY LOGS
  // ============================================
  async findAllActivityLogs(query: ActivityLogsQuery) {
    const { shopId, entityType, action, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (shopId) {
      where.shopId = shopId;
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (action) {
      where.action = { contains: action };
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          shop: { select: { id: true, name: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  // ============================================
  // PLATFORM SETTINGS
  // ============================================
  async getPlatformSettings() {
    const settings = await prisma.platformSetting.findMany();
    
    // Convert to object
    const settingsObj: Record<string, any> = {
      platformName: 'VisionDesk',
      defaultTimezone: 'Europe/Paris',
      defaultCurrency: 'EUR',
      maintenanceMode: false,
    };

    for (const setting of settings) {
      settingsObj[setting.key] = setting.value;
    }

    return settingsObj;
  },

  async updatePlatformSettings(input: UpdatePlatformSettingsInput) {
    const updates = Object.entries(input).filter(([_, value]) => value !== undefined);

    for (const [key, value] of updates) {
      await prisma.platformSetting.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      });
    }

    return this.getPlatformSettings();
  },
};
