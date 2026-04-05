import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { LoginInput } from './auth.schema.js';

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

const getJwtOptions = (): SignOptions => ({
  expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
});

export const authService = {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { shop: true },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError(401, 'Account is disabled');
    }

    // Shop users must belong to an active shop.
    if (user.role !== 'SUPERADMIN' && (!user.shop || !user.shop.isActive)) {
      throw new AppError(401, 'Shop is disabled');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id },
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
        shopId: user.shopId,
        shop: user.shop ? {
          id: user.shop.id,
          name: user.shop.name,
        } : null,
      },
    };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      shopId: user.shopId,
      shop: user.shop ? {
        id: user.shop.id,
        name: user.shop.name,
        logo: user.shop.logo,
      } : null,
    };
  },
};
