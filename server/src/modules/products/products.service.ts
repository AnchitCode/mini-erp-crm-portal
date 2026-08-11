import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { Prisma } from '@prisma/client';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
  AddMovementInput,
} from './products.validation';

export async function createProduct(input: CreateProductInput) {
  // Check for SKU uniqueness
  const existing = await prisma.product.findUnique({
    where: { sku: input.sku.toUpperCase() },
  });
  if (existing) {
    throw new AppError(`Product with SKU ${input.sku} already exists.`, 409);
  }

  return prisma.product.create({
    data: {
      ...input,
      sku: input.sku.toUpperCase(),
      currentStock: 0, // Initial stock is always 0, populated via movements
    },
  });
}

export async function getProducts(query: ProductQueryInput) {
  const { page, limit, search, category, stockStatus } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (stockStatus) {
    if (stockStatus === 'OutOfStock') {
      where.currentStock = 0;
    } else if (stockStatus === 'LowStock') {
      where.currentStock = { gt: 0 };
      // Prisma does not support referencing another column directly in the where clause (e.g. currentStock <= minStockAlert)
      // For LowStock, we'll have to rely on raw query, or fetch and filter if dataset is small, 
      // but since we want to paginate correctly, we use a raw query if necessary.
      // However, to keep it simple and within Prisma constraints without raw SQL mapping,
      // we'll leave this advanced filter for a raw query below if stockStatus is provided.
    }
    // InStock could be tricky if we need to compare two columns.
  }

  // To support accurate "Low Stock" filtering (currentStock <= minStockAlert), we use raw query for the ID list
  let productIds: string[] | null = null;
  
  if (stockStatus) {
    let rawQuery;
    if (stockStatus === 'OutOfStock') {
      rawQuery = Prisma.sql`SELECT id FROM products WHERE current_stock = 0`;
    } else if (stockStatus === 'LowStock') {
      rawQuery = Prisma.sql`SELECT id FROM products WHERE current_stock > 0 AND current_stock <= min_stock_alert`;
    } else if (stockStatus === 'InStock') {
      rawQuery = Prisma.sql`SELECT id FROM products WHERE current_stock > min_stock_alert`;
    }
    
    if (rawQuery) {
      const idsResult = await prisma.$queryRaw<{ id: string }[]>(rawQuery);
      productIds = idsResult.map(r => r.id);
      
      // Merge with existing where clause
      where.id = { in: productIds };
    }
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    products,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          createdBy: { select: { name: true, role: true } },
        },
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  if (input.sku && input.sku.toUpperCase() !== product.sku) {
    const existing = await prisma.product.findUnique({
      where: { sku: input.sku.toUpperCase() },
    });
    if (existing) {
      throw new AppError(`Product with SKU ${input.sku} already exists.`, 409);
    }
  }

  const data: Prisma.ProductUpdateInput = { ...input };
  if (input.sku) data.sku = input.sku.toUpperCase();

  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function addStockMovement(productId: string, userId: string, input: AddMovementInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  return prisma.$transaction(async (tx) => {
    let updatedProduct;

    if (input.movementType === 'IN') {
      // Atomic increment
      updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: input.quantity } },
      });
    } else {
      // Atomic conditional decrement: only update if currentStock >= quantity
      // updateMany is used because Prisma standard update does not support extra conditions natively.
      const result = await tx.product.updateMany({
        where: {
          id: productId,
          currentStock: { gte: input.quantity },
        },
        data: { currentStock: { decrement: input.quantity } },
      });

      if (result.count === 0) {
        throw new AppError('Insufficient stock for this OUT movement.', 400);
      }
    }

    // Create the audit log
    const movement = await tx.stockMovement.create({
      data: {
        productId,
        quantityChanged: input.quantity,
        movementType: input.movementType,
        reason: input.reason,
        createdById: userId,
      },
      include: {
        createdBy: { select: { name: true, role: true } },
      },
    });

    return movement;
  });
}
