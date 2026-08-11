import 'dotenv/config';
import { UserRole, CustomerType, CustomerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/database';

async function main() {
  console.log('🌱 Seeding database...\n');

  // ---------------------------------------------------------------------------
  // 1. Create Users (one per role)
  // ---------------------------------------------------------------------------

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@erp.com',
      passwordHash,
      role: UserRole.Admin,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@erp.com' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'sales@erp.com',
      passwordHash,
      role: UserRole.Sales,
    },
  });

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@erp.com' },
    update: {},
    create: {
      name: 'Amit Patel',
      email: 'warehouse@erp.com',
      passwordHash,
      role: UserRole.Warehouse,
    },
  });

  const accountsUser = await prisma.user.upsert({
    where: { email: 'accounts@erp.com' },
    update: {},
    create: {
      name: 'Priya Gupta',
      email: 'accounts@erp.com',
      passwordHash,
      role: UserRole.Accounts,
    },
  });

  console.log('✅ Users created:');
  console.log(`   Admin:     ${admin.email} (password: password123)`);
  console.log(`   Sales:     ${salesUser.email} (password: password123)`);
  console.log(`   Warehouse: ${warehouseUser.email} (password: password123)`);
  console.log(`   Accounts:  ${accountsUser.email} (password: password123)`);

  // ---------------------------------------------------------------------------
  // 2. Create Sample Products
  // ---------------------------------------------------------------------------

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'PRD-001' },
      update: {},
      create: {
        name: 'Basmati Rice Premium 25kg',
        sku: 'PRD-001',
        category: 'Grains',
        unitPrice: 1250.0,
        currentStock: 150,
        minStockAlert: 20,
        warehouseLocation: 'Warehouse A - Rack 1',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD-002' },
      update: {},
      create: {
        name: 'Refined Sunflower Oil 15L',
        sku: 'PRD-002',
        category: 'Oils',
        unitPrice: 1890.0,
        currentStock: 80,
        minStockAlert: 15,
        warehouseLocation: 'Warehouse A - Rack 3',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD-003' },
      update: {},
      create: {
        name: 'Toor Dal 50kg',
        sku: 'PRD-003',
        category: 'Pulses',
        unitPrice: 5500.0,
        currentStock: 45,
        minStockAlert: 10,
        warehouseLocation: 'Warehouse B - Rack 1',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD-004' },
      update: {},
      create: {
        name: 'Sugar 50kg Bag',
        sku: 'PRD-004',
        category: 'Sweeteners',
        unitPrice: 2100.0,
        currentStock: 5,
        minStockAlert: 10,
        warehouseLocation: 'Warehouse A - Rack 5',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PRD-005' },
      update: {},
      create: {
        name: 'Wheat Flour Chakki Atta 10kg',
        sku: 'PRD-005',
        category: 'Grains',
        unitPrice: 420.0,
        currentStock: 200,
        minStockAlert: 30,
        warehouseLocation: 'Warehouse B - Rack 2',
      },
    }),
  ]);

  console.log(`\n✅ Products created: ${products.length} items`);
  products.forEach((p) => console.log(`   ${p.sku} — ${p.name} (Stock: ${p.currentStock})`));

  // ---------------------------------------------------------------------------
  // 3. Create Sample Customers
  // ---------------------------------------------------------------------------

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Vikram Singh',
        mobile: '9876543210',
        email: 'vikram@singhtraders.com',
        businessName: 'Singh Traders',
        gstNumber: '27AABCS1429B1ZB',
        customerType: CustomerType.Wholesale,
        address: '45 Market Road, Chandni Chowk, Delhi 110006',
        status: CustomerStatus.Active,
        followUpDate: new Date('2026-08-20'),
        notes: 'Bulk buyer of grains. Prefers monthly invoicing.',
      },
    }),
    prisma.customer.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Meena Patel',
        mobile: '9123456789',
        email: 'meena@patelstore.in',
        businessName: 'Patel General Store',
        customerType: CustomerType.Retail,
        address: '12 MG Road, Ahmedabad, Gujarat 380001',
        status: CustomerStatus.Active,
        notes: 'Regular weekly orders. Pays on delivery.',
      },
    }),
    prisma.customer.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Arjun Reddy',
        mobile: '9988776655',
        email: 'arjun@reddydistributors.com',
        businessName: 'Reddy Distributors',
        gstNumber: '36AABCR5678D1ZM',
        customerType: CustomerType.Distributor,
        address: '78 Industrial Area, Hyderabad, Telangana 500032',
        status: CustomerStatus.Lead,
        followUpDate: new Date('2026-08-15'),
        notes: 'Interested in becoming regional distributor for oils.',
      },
    }),
  ]);

  console.log(`\n✅ Customers created: ${customers.length} records`);
  customers.forEach((c) => console.log(`   ${c.name} — ${c.businessName} (${c.status})`));

  // ---------------------------------------------------------------------------
  // 4. Create Sample Stock Movements
  // ---------------------------------------------------------------------------

  await prisma.stockMovement.createMany({
    data: [
      {
        productId: products[0].id,
        quantityChanged: 150,
        movementType: 'IN',
        reason: 'Initial stock entry',
        createdById: warehouseUser.id,
      },
      {
        productId: products[1].id,
        quantityChanged: 80,
        movementType: 'IN',
        reason: 'Initial stock entry',
        createdById: warehouseUser.id,
      },
      {
        productId: products[3].id,
        quantityChanged: 50,
        movementType: 'IN',
        reason: 'Purchase order received',
        createdById: warehouseUser.id,
      },
      {
        productId: products[3].id,
        quantityChanged: 45,
        movementType: 'OUT',
        reason: 'Dispatched to customer',
        createdById: warehouseUser.id,
      },
    ],
  });

  console.log('\n✅ Stock movements created: 4 entries');

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------

  console.log('\n🎉 Seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
