import { z } from 'zod';
import { UserRole } from '@prisma/client';

/**
 * Validation schema for POST /api/auth/login
 */
export const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email format')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
});

/**
 * Validation schema for POST /api/auth/register
 */
export const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .transform((v) => v.trim()),
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email format')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters'),
  role: z.nativeEnum(UserRole, {
    error: `Role must be one of: ${Object.values(UserRole).join(', ')}`,
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
