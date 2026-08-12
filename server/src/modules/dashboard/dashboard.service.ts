import prisma from '../../config/database';
import { UserRole } from '@prisma/client';

export interface DashboardStats {
  totalCustomers?: number;
  totalProducts?: number;
  lowStockAlerts?: number;
  recentChallans?: unknown[];
}

export const dashboardService = {
  async getStats(role: UserRole): Promise<DashboardStats> {
    const stats: DashboardStats = {};

    if (role === 'Admin' || role === 'Sales') {
      stats.totalCustomers = await prisma.customer.count();
      stats.recentChallans = await prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { businessName: true, name: true } },
          _count: { select: { items: true } }
        },
      });
    }

    if (role === 'Admin' || role === 'Warehouse') {
      stats.totalProducts = await prisma.product.count();
      
      const lowStock = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM products WHERE current_stock <= min_stock_alert;
      `;
      stats.lowStockAlerts = Number(lowStock[0]?.count || 0);
    }

    return stats;
  },
};
