import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { AppError } from './errorHandler.js';
import { UserRole } from '@prisma/client';
import { isValidUUID } from '../lib/sanitize.js';

export interface AuthUser {
  id: string;
  shopId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

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

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    if (!token || token.length > 1000) {
      throw new AppError(401, 'Invalid token format');
    }

    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      maxAge: '7d',
    }) as JWTPayload;

    if (!decoded.userId || !isValidUUID(decoded.userId)) {
      throw new AppError(401, 'Invalid token payload');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        shopId: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid or inactive user');
    }

    req.user = {
      id: user.id,
      shopId: user.shopId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token'));
    } else {
      next(new AppError(401, 'Authentication failed'));
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
};

export const isSuperAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'SUPERADMIN') {
    return next(new AppError(403, 'Superadmin access required'));
  }
  next();
};

export const isAdminOrOwner = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user || !['SUPERADMIN', 'OWNER', 'ADMIN'].includes(req.user.role)) {
    return next(new AppError(403, 'Admin access required'));
  }
  next();
};

export const isShopUser = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(401, 'Not authenticated'));
  }
  if (req.user.role === 'SUPERADMIN') {
    return next(new AppError(403, 'Superadmin cannot access shop routes'));
  }
  next();
};

export const requireShopId = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.shopId) {
    return next(new AppError(400, 'Shop context required'));
  }
  next();
};
