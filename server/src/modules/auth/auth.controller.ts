import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { loginSchema, registerSchema } from './auth.validation';
import * as authService from './auth.service';

/**
 * POST /api/auth/login
 */
export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    sendSuccess(res, result, 'Login successful.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/register (Admin-only)
 */
export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const user = await authService.register(input);
    sendSuccess(res, user, 'User registered successfully.', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 */
export async function getMeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.userId);
    sendSuccess(res, user, 'User profile retrieved.');
  } catch (error) {
    next(error);
  }
}
