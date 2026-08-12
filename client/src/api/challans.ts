import api from './client';
import type { ApiResponse } from './auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  product?: {
    id: string;
    name: string;
    currentStock: number;
  };
}

export interface ChallanSummary {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: ChallanStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; businessName: string };
  createdBy: { name: string };
  _count: { items: number };
}

export interface ChallanDetail {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: ChallanStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    businessName: string;
    mobile: string;
    email: string;
    address: string;
  };
  createdBy: { name: string; role: string };
  items: ChallanItem[];
}

export interface ChallanListResponse {
  challans: ChallanSummary[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ChallanQuery {
  page?: number;
  limit?: number;
  status?: ChallanStatus | '';
  customerId?: string;
  search?: string;
}

export interface CreateChallanLineItem {
  productId: string;
  quantity: number;
}

export interface CreateChallanRequest {
  customerId: string;
  items: CreateChallanLineItem[];
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function getChallansApi(query: ChallanQuery = {}): Promise<ChallanListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.status) params.append('status', query.status);
  if (query.search) params.append('search', query.search);

  const res = await api.get<ApiResponse<ChallanSummary[]> & { meta?: ChallanListResponse['meta'] }>(`/challans?${params.toString()}`);
  return {
    challans: res.data.data || [],
    meta: res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export async function getChallanByIdApi(id: string): Promise<ChallanDetail> {
  const res = await api.get<ApiResponse<ChallanDetail>>(`/challans/${id}`);
  return res.data.data;
}

export async function createChallanApi(data: CreateChallanRequest): Promise<ChallanDetail> {
  const res = await api.post<ApiResponse<ChallanDetail>>('/challans', data);
  return res.data.data;
}

export async function confirmChallanApi(id: string): Promise<ChallanDetail> {
  const res = await api.patch<ApiResponse<ChallanDetail>>(`/challans/${id}/confirm`, {});
  return res.data.data;
}

export async function cancelChallanApi(id: string): Promise<ChallanDetail> {
  const res = await api.patch<ApiResponse<ChallanDetail>>(`/challans/${id}/cancel`, {});
  return res.data.data;
}
