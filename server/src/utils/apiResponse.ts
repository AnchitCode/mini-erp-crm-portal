import { Response } from 'express';

interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Consistent API response formatter.
 * Every endpoint returns the same shape: { success, message, data, errors, meta }
 */
export function sendResponse<T>({
  res,
  statusCode = 200,
  success = true,
  message = '',
  data = undefined,
  errors = undefined,
  meta = undefined,
}: ApiResponseOptions<T>): void {
  res.status(statusCode).json({
    success,
    message,
    data: data ?? null,
    ...(errors && { errors }),
    ...(meta && { meta }),
  });
}

/**
 * Shorthand for success responses
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: ApiResponseOptions<T>['meta']
): void {
  sendResponse({ res, statusCode, success: true, message, data, meta });
}

/**
 * Shorthand for error responses
 */
export function sendError(
  res: Response,
  message = 'Something went wrong',
  statusCode = 500,
  errors?: unknown[]
): void {
  sendResponse({ res, statusCode, success: false, message, errors });
}
