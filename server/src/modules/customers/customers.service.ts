import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  AddNoteInput,
  CustomerQueryInput,
} from './customers.validation';
import { Prisma } from '@prisma/client';

export async function createCustomer(input: CreateCustomerInput) {
  // GST normalization (optional fields can come as empty strings from form)
  const gst = input.gstNumber?.trim() || null;

  return prisma.customer.create({
    data: {
      name: input.name,
      mobile: input.mobile,
      email: input.email.toLowerCase(),
      businessName: input.businessName,
      gstNumber: gst,
      customerType: input.customerType,
      address: input.address,
      status: input.status,
      notes: input.notes,
    },
  });
}

export async function getCustomers(query: CustomerQueryInput) {
  const { page, limit, search, status, customerType } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { mobile: { contains: search } },
      { businessName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (customerType) where.customerType = customerType;

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    customers,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followUpNotes: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { name: true, role: true } },
        },
      },
      // Include recent challans just for a summary view on the CRM page
      challans: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          challanNumber: true,
          status: true,
          totalQuantity: true,
          createdAt: true,
        },
      },
    },
  });

  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  return customer;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  // Verify existence
  await getCustomerById(id);

  const data: Prisma.CustomerUpdateInput = { ...input };
  
  if (input.email) data.email = input.email.toLowerCase();
  if (input.gstNumber !== undefined) {
    data.gstNumber = input.gstNumber?.trim() || null;
  }

  return prisma.customer.update({
    where: { id },
    data,
  });
}

export async function addFollowUpNote(customerId: string, createdById: string, input: AddNoteInput) {
  // Verify customer exists
  await getCustomerById(customerId);

  return prisma.followUpNote.create({
    data: {
      customerId,
      createdById,
      note: input.note,
    },
    include: {
      createdBy: { select: { name: true, role: true } },
    },
  });
}
