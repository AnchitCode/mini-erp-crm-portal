import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { Prisma } from '@prisma/client';
import { CreateChallanInput, ChallanQueryInput } from './challans.validation';

// ---------------------------------------------------------------------------
// Challan Number Generator
// Format: CH-YYYYMMDD-XXXX (e.g. CH-20260812-0001)
// Uses a database query to find the next sequence within the same day.
// ---------------------------------------------------------------------------

async function generateChallanNumber(tx: Prisma.TransactionClient): Promise<string> {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');

  const prefix = `CH-${dateStr}-`;

  // Find the highest challan number with today's prefix
  const latest = await tx.challan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: 'desc' },
    select: { challanNumber: true },
  });

  let sequence = 1;
  if (latest) {
    const lastSeq = parseInt(latest.challanNumber.slice(prefix.length), 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}

function isChallanNumberCollision(error: unknown): boolean {
  const prismaError = error as { code?: string; message?: string; meta?: { target?: unknown } };

  if (prismaError.code !== 'P2002') {
    return false;
  }

  const target = prismaError.meta?.target;
  if (Array.isArray(target) && target.includes('challan_number')) {
    return true;
  }

  if (typeof target === 'string' && target.includes('challan_number')) {
    return true;
  }

  return typeof prismaError.message === 'string' && prismaError.message.includes('challan_number');
}

// ---------------------------------------------------------------------------
// Create a Draft Challan
// ---------------------------------------------------------------------------

export async function createChallan(input: CreateChallanInput, userId: string) {
  // Validate customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { id: true },
  });
  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  // Validate all products exist and collect snapshot data
  const productIds = input.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, unitPrice: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Check for missing products
  const missingProducts = productIds.filter((id) => !productMap.has(id));
  if (missingProducts.length > 0) {
    throw new AppError(`Products not found: ${missingProducts.join(', ')}`, 404);
  }

  // Compute total quantity
  const totalQuantity = input.items.reduce((sum, item) => sum + item.quantity, 0);

  // Retry loop to handle concurrent challan number collisions.
  // If two requests generate the same CH-YYYYMMDD-XXXX number simultaneously,
  // the unique DB constraint on challan_number causes a P2002 error.
  // We catch it and retry with a fresh transaction (which will read the
  // now-committed row and generate the next sequence number).
  const MAX_RETRIES = 10;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const challanNumber = await generateChallanNumber(tx);

        const challan = await tx.challan.create({
          data: {
            challanNumber,
            customerId: input.customerId,
            totalQuantity,
            status: 'Draft',
            createdById: userId,
            items: {
              create: input.items.map((item) => {
                const product = productMap.get(item.productId)!;
                return {
                  productId: item.productId,
                  productNameSnapshot: product.name,
                  productSkuSnapshot: product.sku,
                  unitPriceSnapshot: product.unitPrice,
                  quantity: item.quantity,
                };
              }),
            },
          },
          include: {
            customer: { select: { id: true, name: true, businessName: true } },
            createdBy: { select: { name: true, role: true } },
            items: true,
          },
        });

        return challan;
      });
    } catch (error: unknown) {
      if (isChallanNumberCollision(error) && attempt < MAX_RETRIES) {
        // Retry — the next attempt will read the committed row and pick the next number
        console.warn(`[ChallanService] Concurrent generation collision on attempt ${attempt}. Retrying...`);
        continue;
      }
      throw error;
    }
  }

  // This line is unreachable but satisfies TypeScript's return type checker
  throw new AppError('Failed to generate a unique challan number after multiple retries.', 500);
}

// ---------------------------------------------------------------------------
// List Challans (paginated + filters)
// ---------------------------------------------------------------------------

export async function getChallans(query: ChallanQueryInput) {
  const { page, limit, status, customerId, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ChallanWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (search) {
    where.OR = [
      { challanNumber: { contains: search, mode: 'insensitive' } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, challans] = await Promise.all([
    prisma.challan.count({ where }),
    prisma.challan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        createdBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    challans,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ---------------------------------------------------------------------------
// Get Challan Detail
// ---------------------------------------------------------------------------

export async function getChallanById(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, businessName: true, mobile: true, email: true, address: true },
      },
      createdBy: { select: { name: true, role: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, currentStock: true } },
        },
      },
    },
  });

  if (!challan) {
    throw new AppError('Challan not found.', 404);
  }

  return challan;
}

// ---------------------------------------------------------------------------
// Confirm Challan (Draft → Confirmed)
//
// CRITICAL: This is the most important business logic in the application.
//
// Strategy for concurrency-safe stock deduction:
//   1. Verify challan is Draft (inside transaction).
//   2. Load all line items.
//   3. PRE-VALIDATE: Check stock sufficiency for ALL items before any deduction.
//      Return a clear error listing ALL insufficient products.
//   4. DEDUCT ATOMICALLY: Use Prisma updateMany with WHERE { id, currentStock >= qty }
//      so that even under concurrency, no product can go negative.
//      If any updateMany returns count=0, rollback everything.
//   5. Create OUT stock-movement audit records for each deduction.
//   6. Change challan status to Confirmed.
//   7. Transaction ensures all-or-nothing semantics.
// ---------------------------------------------------------------------------

export async function confirmChallan(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Load the challan with items
    const challan = await tx.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      throw new AppError('Challan not found.', 404);
    }

    if (challan.status !== 'Draft') {
      throw new AppError(
        `Cannot confirm challan. Current status is "${challan.status}". Only Draft challans can be confirmed.`,
        400
      );
    }

    // 2. Load current stock for all products in the challan
    const productIds = challan.items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, currentStock: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 3. PRE-VALIDATE: Check stock sufficiency for ALL items
    const insufficientItems: { productName: string; sku: string; required: number; available: number }[] = [];

    for (const item of challan.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        insufficientItems.push({
          productName: item.productNameSnapshot,
          sku: item.productSkuSnapshot,
          required: item.quantity,
          available: 0,
        });
        continue;
      }
      if (product.currentStock < item.quantity) {
        insufficientItems.push({
          productName: product.name,
          sku: product.sku,
          required: item.quantity,
          available: product.currentStock,
        });
      }
    }

    if (insufficientItems.length > 0) {
      const details = insufficientItems
        .map((i) => `${i.productName} (${i.sku}): need ${i.required}, have ${i.available}`)
        .join('; ');
      throw new AppError(`Insufficient stock for confirmation. ${details}`, 400);
    }

    // 4. DEDUCT ATOMICALLY using conditional updateMany for each item
    for (const item of challan.items) {
      const result = await tx.product.updateMany({
        where: {
          id: item.productId,
          currentStock: { gte: item.quantity },
        },
        data: {
          currentStock: { decrement: item.quantity },
        },
      });

      // If updateMany matched 0 rows, a concurrent operation already depleted stock
      if (result.count === 0) {
        throw new AppError(
          `Concurrent stock conflict for product "${item.productNameSnapshot}" (${item.productSkuSnapshot}). Another operation modified the stock. Please retry.`,
          409
        );
      }
    }

    // 5. Create OUT stock-movement audit records
    await tx.stockMovement.createMany({
      data: challan.items.map((item) => ({
        productId: item.productId,
        quantityChanged: item.quantity,
        movementType: 'OUT' as const,
        reason: `Challan ${challan.challanNumber} confirmed`,
        createdById: userId,
      })),
    });

    // 6. Update challan status
    const confirmed = await tx.challan.update({
      where: { id },
      data: { status: 'Confirmed' },
      include: {
        customer: {
          select: { id: true, name: true, businessName: true, mobile: true, email: true, address: true },
        },
        createdBy: { select: { name: true, role: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, currentStock: true } },
          },
        },
      },
    });

    return confirmed;
  });
}

// ---------------------------------------------------------------------------
// Cancel Challan
//
// Implementation Assumption: When cancelling a previously Confirmed challan,
// stock is RESTORED transactionally and corresponding IN stock-movement audit
// records are created. This provides a complete audit trail and ensures
// inventory accuracy. This behavior is NOT explicitly stated in the original
// requirements PDF, but is the most logical business-safe approach.
//
// Draft → Cancelled: No stock changes needed (stock was never deducted).
// Confirmed → Cancelled: Stock is restored for all line items.
// Cancelled → *: Not allowed.
// ---------------------------------------------------------------------------

export async function cancelChallan(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      throw new AppError('Challan not found.', 404);
    }

    if (challan.status === 'Cancelled') {
      throw new AppError('Challan is already cancelled.', 400);
    }

    // If previously confirmed, restore stock
    if (challan.status === 'Confirmed') {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
      }

      // Create IN stock-movement audit records for restoration
      await tx.stockMovement.createMany({
        data: challan.items.map((item) => ({
          productId: item.productId,
          quantityChanged: item.quantity,
          movementType: 'IN' as const,
          reason: `Challan ${challan.challanNumber} cancelled — stock restored`,
          createdById: userId,
        })),
      });
    }

    const cancelled = await tx.challan.update({
      where: { id },
      data: { status: 'Cancelled' },
      include: {
        customer: {
          select: { id: true, name: true, businessName: true, mobile: true, email: true, address: true },
        },
        createdBy: { select: { name: true, role: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, currentStock: true } },
          },
        },
      },
    });

    return cancelled;
  });
}
