import { z } from 'zod';
import { MovementType } from '@prisma/client';

export const createProductSchema = z.object({
  name: z.string({ error: 'Name is required' }).min(2, 'Name must be at least 2 characters').max(150),
  sku: z.string({ error: 'SKU is required' }).min(2, 'SKU must be at least 2 characters').max(50),
  category: z.string({ error: 'Category is required' }).min(2).max(100),
  unitPrice: z.coerce.number({ error: 'Unit price is required' }).positive('Unit price must be positive'),
  minStockAlert: z.coerce.number().int().min(0, 'Minimum stock cannot be negative').default(0),
  warehouseLocation: z.string({ error: 'Warehouse location is required' }).min(2, 'Warehouse location is required'),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  stockStatus: z.enum(['InStock', 'LowStock', 'OutOfStock', '']).optional(),
});

export const addMovementSchema = z.object({
  movementType: z.nativeEnum(MovementType, {
    error: `Movement Type must be one of: ${Object.values(MovementType).join(', ')}`,
  }),
  quantity: z.coerce.number({ error: 'Quantity is required' }).int().positive('Quantity must be greater than zero'),
  reason: z.string({ error: 'Reason is required' }).min(3, 'Reason must be at least 3 characters'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type AddMovementInput = z.infer<typeof addMovementSchema>;
