import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { Prisma, type ChallanStatus } from '@prisma/client';
import prisma from '../src/config/database';
import {
  cancelChallan,
  confirmChallan,
  createChallan,
  getChallans,
  getChallanById,
} from '../src/modules/challans/challans.service';
import { createChallanSchema } from '../src/modules/challans/challans.validation';

type DecimalLike = Prisma.Decimal;

type MockState = {
  products: Array<{
    id: string;
    name: string;
    sku: string;
    unitPrice: DecimalLike;
    currentStock: number;
  }>;
  movementCreates: Array<unknown>;
  lastChallanUpdate?: { id: string; status: ChallanStatus };
};

const originalPrisma = {
  customerFindUnique: prisma.customer.findUnique,
  productFindMany: prisma.product.findMany,
  challanFindUnique: prisma.challan.findUnique,
  stockMovementCreateMany: prisma.stockMovement.createMany,
  challanUpdate: prisma.challan.update,
  transaction: prisma.$transaction,
};

function restorePrisma() {
  prisma.customer.findUnique = originalPrisma.customerFindUnique;
  prisma.product.findMany = originalPrisma.productFindMany;
  prisma.challan.findUnique = originalPrisma.challanFindUnique;
  prisma.stockMovement.createMany = originalPrisma.stockMovementCreateMany;
  prisma.challan.update = originalPrisma.challanUpdate;
  prisma.$transaction = originalPrisma.transaction;
}

function cloneState(state: MockState): MockState {
  return {
    products: state.products.map((product) => ({ ...product })),
    movementCreates: state.movementCreates.map((entry) => {
      if (entry && typeof entry === 'object') {
        return { ...(entry as Record<string, unknown>) };
      }
      return entry;
    }),
    lastChallanUpdate: state.lastChallanUpdate ? { ...state.lastChallanUpdate } : undefined,
  };
}

function installTransactionalMock(state: MockState, buildTx: (draftState: MockState) => unknown) {
  prisma.$transaction = (async <T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) => {
    const draftState = cloneState(state);
    try {
      const tx = buildTx(draftState) as Prisma.TransactionClient;
      const result = await callback(tx);
      state.products = draftState.products;
      state.movementCreates = draftState.movementCreates;
      state.lastChallanUpdate = draftState.lastChallanUpdate;
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }) as typeof prisma.$transaction;
}

afterEach(() => {
  restorePrisma();
});

test('createChallan retries once on challan number collision and preserves snapshots', async () => {
  const customerId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const productA = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Rice',
    sku: 'RICE-01',
    unitPrice: new Prisma.Decimal('1250.00'),
    currentStock: 15,
  };
  const productB = {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Oil',
    sku: 'OIL-02',
    unitPrice: new Prisma.Decimal('1890.00'),
    currentStock: 8,
  };

  let transactionAttempts = 0;
  let createAttempts = 0;
  let capturedCreateData: Record<string, unknown> | null = null;

  prisma.customer.findUnique = async () => ({ id: customerId });
  prisma.product.findMany = async () => [productA, productB];
  prisma.$transaction = (async <T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) => {
    transactionAttempts += 1;
    const tx = {
      challan: {
        findFirst: async () =>
          transactionAttempts === 1 ? null : { challanNumber: 'CH-20260812-0001' },
        create: async (args: { data: Record<string, unknown> }) => {
          createAttempts += 1;
          capturedCreateData = args.data;

          if (createAttempts === 1) {
            throw {
              code: 'P2002',
              message: 'Unique constraint failed on the fields: (`challan_number`)',
              meta: { target: ['challan_number'] },
            };
          }

          return {
            id: 'challan-1',
            challanNumber: String(args.data.challanNumber),
            customerId: String(args.data.customerId),
            totalQuantity: Number(args.data.totalQuantity),
            status: args.data.status,
            createdById: String(args.data.createdById),
            customer: { id: customerId, name: 'Customer', businessName: 'Customer Biz' },
            createdBy: { name: 'Sales User', role: 'Sales' },
            items: Array.isArray((args.data as { items?: { create?: unknown[] } }).items?.create)
              ? (args.data as { items: { create: unknown[] } }).items.create
              : [],
          };
        },
      },
    } as unknown as Prisma.TransactionClient;

    return callback(tx);
  }) as typeof prisma.$transaction;

  const challan = await createChallan(
    {
      customerId,
      items: [
        { productId: productA.id, quantity: 2 },
        { productId: productB.id, quantity: 3 },
      ],
    },
    userId
  );

  assert.equal(transactionAttempts, 2);
  assert.equal(createAttempts, 2);
  assert.match(challan.challanNumber, /^CH-\d{8}-0002$/);
  assert.equal(challan.totalQuantity, 5);
  assert.ok(capturedCreateData);

  const items = (capturedCreateData?.items as { create: Array<Record<string, unknown>> }).create;
  assert.equal(items.length, 2);
  assert.equal(items[0].productNameSnapshot, 'Rice');
  assert.equal(items[0].productSkuSnapshot, 'RICE-01');
  assert.equal(String(items[0].unitPriceSnapshot), '1250');
  assert.equal(items[0].quantity, 2);
});

test('createChallan schema rejects zero quantity and missing line items', () => {
  const validCustomerId = '11111111-1111-1111-1111-111111111111';
  const validProductId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  const invalidQuantity = createChallanSchema.safeParse({
    customerId: validCustomerId,
    items: [{ productId: validProductId, quantity: 0 }],
  });
  assert.equal(invalidQuantity.success, false);

  const missingItems = createChallanSchema.safeParse({ customerId: validCustomerId, items: [] });
  assert.equal(missingItems.success, false);
});

test('confirmChallan fails before any stock change when one item is insufficient', async () => {
  const state: MockState = {
    products: [
      { id: 'p1', name: 'Rice', sku: 'RICE-01', unitPrice: new Prisma.Decimal('100.00'), currentStock: 10 },
      { id: 'p2', name: 'Oil', sku: 'OIL-02', unitPrice: new Prisma.Decimal('200.00'), currentStock: 1 },
    ],
    movementCreates: [],
  };

  let updateManyCalls = 0;
  let movementCalls = 0;
  let challanUpdateCalls = 0;

  prisma.challan.findUnique = async () => ({
    id: 'challan-1',
    challanNumber: 'CH-20260812-0001',
    customerId: 'customer-1',
    totalQuantity: 5,
    status: 'Draft',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      { id: 'item-1', challanId: 'challan-1', productId: 'p1', productNameSnapshot: 'Rice', productSkuSnapshot: 'RICE-01', unitPriceSnapshot: new Prisma.Decimal('100.00'), quantity: 2 },
      { id: 'item-2', challanId: 'challan-1', productId: 'p2', productNameSnapshot: 'Oil', productSkuSnapshot: 'OIL-02', unitPriceSnapshot: new Prisma.Decimal('200.00'), quantity: 3 },
    ],
  });

  installTransactionalMock(state, (draftState) => ({
    challan: {
      findUnique: async () => ({
        id: 'challan-1',
        challanNumber: 'CH-20260812-0001',
        customerId: 'customer-1',
        totalQuantity: 5,
        status: 'Draft',
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          { id: 'item-1', challanId: 'challan-1', productId: 'p1', productNameSnapshot: 'Rice', productSkuSnapshot: 'RICE-01', unitPriceSnapshot: new Prisma.Decimal('100.00'), quantity: 2 },
          { id: 'item-2', challanId: 'challan-1', productId: 'p2', productNameSnapshot: 'Oil', productSkuSnapshot: 'OIL-02', unitPriceSnapshot: new Prisma.Decimal('200.00'), quantity: 3 },
        ],
      }),
      update: async () => {
        challanUpdateCalls += 1;
        return {};
      },
    },
    product: {
      findMany: async () => draftState.products,
      updateMany: async () => {
        updateManyCalls += 1;
        throw new Error('updateMany should not be called when stock is insufficient');
      },
    },
    stockMovement: {
      createMany: async () => {
        movementCalls += 1;
        return { count: 0 };
      },
    },
  }));

  await assert.rejects(
    () => confirmChallan('challan-1', 'user-1'),
    /Insufficient stock for confirmation\./
  );
  assert.equal(updateManyCalls, 0);
  assert.equal(movementCalls, 0);
  assert.equal(challanUpdateCalls, 0);
  assert.equal(state.products[0].currentStock, 10);
  assert.equal(state.products[1].currentStock, 1);
});

test('confirmChallan rolls back partial deductions on concurrent stock conflict', async () => {
  const state: MockState = {
    products: [
      { id: 'p1', name: 'Rice', sku: 'RICE-01', unitPrice: new Prisma.Decimal('100.00'), currentStock: 10 },
      { id: 'p2', name: 'Oil', sku: 'OIL-02', unitPrice: new Prisma.Decimal('200.00'), currentStock: 8 },
    ],
    movementCreates: [],
  };

  installTransactionalMock(state, (draftState) => ({
    challan: {
      findUnique: async () => ({
        id: 'challan-1',
        challanNumber: 'CH-20260812-0001',
        customerId: 'customer-1',
        totalQuantity: 7,
        status: 'Draft',
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          { id: 'item-1', challanId: 'challan-1', productId: 'p1', productNameSnapshot: 'Rice', productSkuSnapshot: 'RICE-01', unitPriceSnapshot: new Prisma.Decimal('100.00'), quantity: 3 },
          { id: 'item-2', challanId: 'challan-1', productId: 'p2', productNameSnapshot: 'Oil', productSkuSnapshot: 'OIL-02', unitPriceSnapshot: new Prisma.Decimal('200.00'), quantity: 4 },
        ],
      }),
      update: async () => {
        draftState.lastChallanUpdate = { id: 'challan-1', status: 'Confirmed' };
        return {};
      },
    },
    product: {
      findMany: async () => draftState.products,
      updateMany: async ({ where, data }: { where: { id: string }; data: { currentStock: { decrement: number } } }) => {
        const product = draftState.products.find((entry) => entry.id === where.id);
        if (!product) {
          return { count: 0 };
        }

        if (product.id === 'p1') {
          product.currentStock -= data.currentStock.decrement;
          return { count: 1 };
        }

        return { count: 0 };
      },
    },
    stockMovement: {
      createMany: async () => ({ count: 0 }),
    },
  }));

  await assert.rejects(
    () => confirmChallan('challan-1', 'user-1'),
    /Concurrent stock conflict/
  );

  assert.equal(state.products[0].currentStock, 10);
  assert.equal(state.products[1].currentStock, 8);
  assert.equal(state.lastChallanUpdate, undefined);
});

test('confirmChallan deducts stock and creates OUT movements when stock is sufficient', async () => {
  const state: MockState = {
    products: [
      { id: 'p1', name: 'Rice', sku: 'RICE-01', unitPrice: new Prisma.Decimal('100.00'), currentStock: 10 },
      { id: 'p2', name: 'Oil', sku: 'OIL-02', unitPrice: new Prisma.Decimal('200.00'), currentStock: 8 },
    ],
    movementCreates: [],
  };

  installTransactionalMock(state, (draftState) => ({
    challan: {
      findUnique: async () => ({
        id: 'challan-1',
        challanNumber: 'CH-20260812-0001',
        customerId: 'customer-1',
        totalQuantity: 5,
        status: 'Draft',
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          { id: 'item-1', challanId: 'challan-1', productId: 'p1', productNameSnapshot: 'Rice', productSkuSnapshot: 'RICE-01', unitPriceSnapshot: new Prisma.Decimal('100.00'), quantity: 2 },
          { id: 'item-2', challanId: 'challan-1', productId: 'p2', productNameSnapshot: 'Oil', productSkuSnapshot: 'OIL-02', unitPriceSnapshot: new Prisma.Decimal('200.00'), quantity: 3 },
        ],
      }),
      update: async () => ({
        id: 'challan-1',
        challanNumber: 'CH-20260812-0001',
        customerId: 'customer-1',
        totalQuantity: 5,
        status: 'Confirmed' as const,
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: { id: 'customer-1', name: 'Customer', businessName: 'Customer Biz' },
        createdBy: { name: 'Sales User', role: 'Sales' },
        items: [],
      }),
    },
    product: {
      findMany: async () => draftState.products,
      updateMany: async ({ where, data }: { where: { id: string }; data: { currentStock: { decrement: number } } }) => {
        const product = draftState.products.find((entry) => entry.id === where.id);
        if (!product || product.currentStock < data.currentStock.decrement) {
          return { count: 0 };
        }
        product.currentStock -= data.currentStock.decrement;
        return { count: 1 };
      },
    },
    stockMovement: {
      createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
        draftState.movementCreates.push(...data);
        return { count: data.length };
      },
    },
  }));

  const confirmed = await confirmChallan('challan-1', 'user-1');

  assert.equal(confirmed.status, 'Confirmed');
  assert.equal(state.products[0].currentStock, 8);
  assert.equal(state.products[1].currentStock, 5);
  assert.equal(state.movementCreates.length, 2);
  assert.equal((state.movementCreates[0] as Record<string, unknown>).movementType, 'OUT');
});

test('confirmChallan rejects non-Draft challans', async () => {
  prisma.$transaction = (async <T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) => {
    const tx = {
      challan: {
        findUnique: async () => ({
          id: 'challan-1',
          challanNumber: 'CH-20260812-0001',
          customerId: 'customer-1',
          totalQuantity: 2,
          status: 'Confirmed',
          createdById: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        }),
      },
    } as unknown as Prisma.TransactionClient;

    return callback(tx);
  }) as typeof prisma.$transaction;

  await assert.rejects(() => confirmChallan('challan-1', 'user-1'), /Only Draft challans can be confirmed/);
});

test('cancelChallan leaves Draft stock unchanged and restores Confirmed stock atomically', async () => {
  const draftState: MockState = {
    products: [
      { id: 'p1', name: 'Rice', sku: 'RICE-01', unitPrice: new Prisma.Decimal('100.00'), currentStock: 10 },
    ],
    movementCreates: [],
  };

  installTransactionalMock(draftState, (state) => ({
    challan: {
      findUnique: async () => ({
        id: 'draft-challan',
        challanNumber: 'CH-20260812-0002',
        customerId: 'customer-1',
        totalQuantity: 2,
        status: 'Draft',
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          { id: 'item-1', challanId: 'draft-challan', productId: 'p1', productNameSnapshot: 'Rice', productSkuSnapshot: 'RICE-01', unitPriceSnapshot: new Prisma.Decimal('100.00'), quantity: 2 },
        ],
      }),
      update: async () => ({ status: 'Cancelled' }),
    },
    product: {
      update: async () => {
        throw new Error('Draft cancellations should not change stock');
      },
    },
    stockMovement: {
      createMany: async () => {
        throw new Error('Draft cancellations should not create movements');
      },
    },
  }));

  const cancelledDraft = await cancelChallan('draft-challan', 'user-1');
  assert.equal(cancelledDraft.status, 'Cancelled');
  assert.equal(draftState.products[0].currentStock, 10);

  const confirmedState: MockState = {
    products: [
      { id: 'p1', name: 'Rice', sku: 'RICE-01', unitPrice: new Prisma.Decimal('100.00'), currentStock: 8 },
    ],
    movementCreates: [],
  };

  installTransactionalMock(confirmedState, (state) => ({
    challan: {
      findUnique: async () => ({
        id: 'confirmed-challan',
        challanNumber: 'CH-20260812-0003',
        customerId: 'customer-1',
        totalQuantity: 2,
        status: 'Confirmed',
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          { id: 'item-1', challanId: 'confirmed-challan', productId: 'p1', productNameSnapshot: 'Rice', productSkuSnapshot: 'RICE-01', unitPriceSnapshot: new Prisma.Decimal('100.00'), quantity: 2 },
        ],
      }),
      update: async () => ({
        id: 'confirmed-challan',
        challanNumber: 'CH-20260812-0003',
        customerId: 'customer-1',
        totalQuantity: 2,
        status: 'Cancelled' as const,
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: { id: 'customer-1', name: 'Customer', businessName: 'Customer Biz' },
        createdBy: { name: 'Sales User', role: 'Sales' },
        items: [],
      }),
    },
    product: {
      update: async ({ where, data }: { where: { id: string }; data: { currentStock: { increment: number } } }) => {
        const product = state.products.find((entry) => entry.id === where.id);
        if (!product) {
          throw new Error('Missing product in test state');
        }
        product.currentStock += data.currentStock.increment;
        return product;
      },
    },
    stockMovement: {
      createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
        state.movementCreates.push(...data);
        return { count: data.length };
      },
    },
  }));

  const cancelledConfirmed = await cancelChallan('confirmed-challan', 'user-1');
  assert.equal(cancelledConfirmed.status, 'Cancelled');
  assert.equal(confirmedState.products[0].currentStock, 10);
  assert.equal(confirmedState.movementCreates.length, 1);
  assert.equal((confirmedState.movementCreates[0] as Record<string, unknown>).movementType, 'IN');
});

test('cancelChallan rejects already cancelled challans', async () => {
  prisma.$transaction = (async <T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) => {
    const tx = {
      challan: {
        findUnique: async () => ({
          id: 'challan-1',
          challanNumber: 'CH-20260812-0001',
          customerId: 'customer-1',
          totalQuantity: 2,
          status: 'Cancelled',
          createdById: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        }),
      },
    } as unknown as Prisma.TransactionClient;

    return callback(tx);
  }) as typeof prisma.$transaction;

  await assert.rejects(() => cancelChallan('challan-1', 'user-1'), /already cancelled/);
});

test('getChallans applies filters and pagination metadata', async () => {
  let capturedWhere: Record<string, unknown> | null = null;
  let capturedSkip = 0;
  let capturedTake = 0;

  prisma.challan.count = async ({ where }) => {
    capturedWhere = where as Record<string, unknown>;
    return 25;
  };
  prisma.challan.findMany = async ({ where, skip, take }) => {
    capturedWhere = where as Record<string, unknown>;
    capturedSkip = skip ?? 0;
    capturedTake = take ?? 0;
    return [];
  };

  const result = await getChallans({ page: 2, limit: 10, status: 'Draft', customerId: 'customer-1', search: 'singh' });

  assert.equal(result.meta.page, 2);
  assert.equal(result.meta.limit, 10);
  assert.equal(result.meta.total, 25);
  assert.equal(result.meta.totalPages, 3);
  assert.equal(capturedSkip, 10);
  assert.equal(capturedTake, 10);
  assert.ok(capturedWhere);
  assert.equal((capturedWhere as { status?: string }).status, 'Draft');
  assert.equal((capturedWhere as { customerId?: string }).customerId, 'customer-1');
  assert.ok(Array.isArray((capturedWhere as { OR?: unknown[] }).OR));
});

test('getChallanById returns snapshot values even when current product stock changes', async () => {
  prisma.challan.findUnique = async () => ({
    id: 'challan-1',
    challanNumber: 'CH-20260812-0001',
    customerId: 'customer-1',
    totalQuantity: 2,
    status: 'Draft',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer-1',
      name: 'Customer Name',
      businessName: 'Customer Biz',
      mobile: '9999999999',
      email: 'customer@example.com',
      address: '123 Street',
    },
    createdBy: { name: 'Sales User', role: 'Sales' },
    items: [
      {
        id: 'item-1',
        challanId: 'challan-1',
        productId: 'p1',
        productNameSnapshot: 'Original Rice',
        productSkuSnapshot: 'RICE-OLD',
        unitPriceSnapshot: new Prisma.Decimal('100.00'),
        quantity: 2,
        product: { id: 'p1', name: 'Updated Rice', currentStock: 99 },
      },
    ],
  });

  const challan = await getChallanById('challan-1');
  assert.equal(challan.items[0].productNameSnapshot, 'Original Rice');
  assert.equal(challan.items[0].productSkuSnapshot, 'RICE-OLD');
  assert.equal(Number(challan.items[0].unitPriceSnapshot), 100);
  assert.equal(challan.items[0].product?.currentStock, 99);
});
