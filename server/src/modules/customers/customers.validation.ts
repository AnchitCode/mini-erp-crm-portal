import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

const mobileRegex = /^[0-9]{10,15}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const createCustomerSchema = z.object({
  name: z.string({ error: 'Name is required' }).min(2, 'Name is too short').max(100),
  mobile: z
    .string({ error: 'Mobile number is required' })
    .regex(mobileRegex, 'Invalid mobile number format'),
  email: z.string({ error: 'Email is required' }).email('Invalid email format'),
  businessName: z.string({ error: 'Business name is required' }).min(2).max(150),
  gstNumber: z
    .string()
    .regex(gstRegex, 'Invalid GST number format')
    .optional()
    .or(z.literal('')),
  customerType: z.nativeEnum(CustomerType, {
    error: `Customer Type must be one of: ${Object.values(CustomerType).join(', ')}`,
  }),
  address: z.string({ error: 'Address is required' }).min(5, 'Address is too short'),
  status: z.nativeEnum(CustomerStatus).optional().default(CustomerStatus.Lead),
  followUpDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const addNoteSchema = z.object({
  note: z.string({ error: 'Note content is required' }).min(1, 'Note cannot be empty'),
});

export const customerQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
