import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

/**
 * Custom application error with HTTP status code
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handling middleware.
 * Catches all errors and returns a consistent API response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Known operational errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Prisma known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const target = prismaErr.meta?.target || 'field';
      sendError(res, `A record with this ${target} already exists.`, 409);
      return;
    }
    if (prismaErr.code === 'P2025') {
      sendError(res, 'Record not found.', 404);
      return;
    }
  }

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    sendError(res, 'Invalid data provided.', 400);
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const zodErr = err as any;
    sendError(res, 'Validation failed.', 400, zodErr.errors);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token.', 401);
    return;
  }
  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired.', 401);
    return;
  }

  // Unknown errors — don't leak internals
  sendError(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error.',
    500
  );
}

/**
 * Catch 404 routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found.`, 404);
}
