import api from './client';
import type { ApiResponse } from './auth';

export interface DashboardStats {
  totalCustomers?: number;
  totalProducts?: number;
  lowStockAlerts?: number;
  recentChallans?: {
    id: string;
    challanNumber: string;
    status: string;
    totalQuantity: number;
    createdAt: string;
    customer: {
      name: string;
      businessName: string;
    };
    _count: {
      items: number;
    };
  }[];
}

export async function getDashboardStatsApi(): Promise<DashboardStats> {
  const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return res.data.data;
}
