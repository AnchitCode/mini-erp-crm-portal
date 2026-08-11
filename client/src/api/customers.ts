import api from './client';
import type { ApiResponse } from './auth';

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';
// ... rest remains same until getCustomersApi


export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpNote {
  id: string;
  note: string;
  createdAt: string;
  createdBy: {
    name: string;
    role: string;
  };
}

export interface CustomerDetail extends Customer {
  followUpNotes: FollowUpNote[];
  challans: Array<{
    id: string;
    challanNumber: string;
    status: string;
    totalQuantity: number;
    createdAt: string;
  }>;
}

export interface CustomerListResponse {
  customers: Customer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus | '';
  customerType?: CustomerType | '';
}

export type CreateCustomerRequest = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'followUpDate'> & {
  followUpDate?: string;
};
export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export async function getCustomersApi(query: CustomerQuery = {}): Promise<CustomerListResponse> {
  const res = await api.get<ApiResponse<Customer[]> & { meta?: CustomerListResponse['meta'] }>('/customers', {
    params: query,
  });
  return {
    customers: res.data.data || [],
    meta: res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export async function getCustomerByIdApi(id: string): Promise<CustomerDetail> {
  const res = await api.get<ApiResponse<CustomerDetail>>(`/customers/${id}`);
  return res.data.data;
}

export async function createCustomerApi(data: CreateCustomerRequest): Promise<Customer> {
  const res = await api.post<ApiResponse<Customer>>('/customers', data);
  return res.data.data;
}

export async function updateCustomerApi(id: string, data: UpdateCustomerRequest): Promise<Customer> {
  const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
  return res.data.data;
}

export async function addFollowUpNoteApi(customerId: string, note: string): Promise<FollowUpNote> {
  const res = await api.post<ApiResponse<FollowUpNote>>(`/customers/${customerId}/notes`, { note });
  return res.data.data;
}
