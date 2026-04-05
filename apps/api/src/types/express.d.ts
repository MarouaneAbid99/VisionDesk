import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        shopId: string;
        role: string;
        email: string;
      };
    }
  }
}

export {};
