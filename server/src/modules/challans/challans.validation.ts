import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Line item schema — used inside createChallanSchema
// ---------------------------------------------------------------------------

const challanItemSchema = z.object({
  productId: z.string({ error: 'Product ID is required' }).uuid('Invalid product ID'),
  quantity: z.coerce.number({ error: 'Quantity is required' }).int().positive('Quantity must be greater than zero'),
});

// ---------------------------------------------------------------------------
// Create Challan
// ---------------------------------------------------------------------------

export const createChallanSchema = z.object({
  customerId: z.string({ error: 'Customer is required' }),
  items: z
    .array(challanItemSchema)
    .min(1, 'At least one line item is required'),
});

// ---------------------------------------------------------------------------
// Query Challans (list with filters & pagination)
// ---------------------------------------------------------------------------

export const challanQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.nativeEnum(ChallanStatus).optional(),
  customerId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type ChallanQueryInput = z.infer<typeof challanQuerySchema>;
