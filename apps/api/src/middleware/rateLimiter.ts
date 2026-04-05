import { Request, Response, NextFunction, RequestHandler } from 'express';

// Simple in-memory rate limiter (can be replaced with express-rate-limit when dependencies are installed)
interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: { success: boolean; error: { message: string; code: number } };
}): RequestHandler => {
  const store: RateLimitStore = {};

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = { count: 1, resetTime: now + options.windowMs };
    } else {
      store[key].count++;
    }

    if (store[key].count > options.max) {
      res.setHeader('Retry-After', Math.ceil((store[key].resetTime - now) / 1000));
      return res.status(429).json(options.message);
    }

    next();
  };
};

// General API rate limiter
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 429,
    },
  },
});

// Strict limiter for auth endpoints
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per window
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 429,
    },
  },
});

// Search endpoint limiter
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute
  message: {
    success: false,
    error: {
      message: 'Too many search requests, please slow down',
      code: 429,
    },
  },
});

// Automation endpoint limiter (webhooks, triggers)
export const automationLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 automation calls per minute
  message: {
    success: false,
    error: {
      message: 'Too many automation requests',
      code: 429,
    },
  },
});
