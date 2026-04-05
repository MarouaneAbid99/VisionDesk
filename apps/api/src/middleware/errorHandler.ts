import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../lib/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const isPrismaError = (err: unknown): err is Prisma.PrismaClientKnownRequestError => {
  return err instanceof Prisma.PrismaClientKnownRequestError;
};

const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError): { status: number; message: string } => {
  switch (err.code) {
    case 'P2002':
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      return { status: 409, message: `A record with this ${field} already exists` };
    case 'P2003':
      return { status: 400, message: 'Invalid reference: related record not found' };
    case 'P2025':
      return { status: 404, message: 'Record not found' };
    case 'P2014':
      return { status: 400, message: 'Cannot delete: record has related data' };
    default:
      return { status: 500, message: 'Database operation failed' };
  }
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Operational errors (expected)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.statusCode,
      },
    });
  }

  // Validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        code: 400,
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Prisma errors
  if (isPrismaError(err)) {
    const { status, message } = handlePrismaError(err);
    return res.status(status).json({
      success: false,
      error: {
        message,
        code: status,
      },
    });
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid data provided',
        code: 400,
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        code: 401,
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token expired',
        code: 401,
      },
    });
  }

  // Syntax errors (malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid JSON in request body',
        code: 400,
      },
    });
  }

  // Log unexpected errors (don't expose details to client)
  logger.error({
    err,
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  }, 'Unexpected error');

  // In development, include error details in response for debugging
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    error: {
      message: isDev ? err.message : 'An unexpected error occurred',
      code: 500,
      ...(isDev && { name: err.name, stack: err.stack }),
    },
  });
};
