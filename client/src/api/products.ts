import api from './client';
import type { ApiResponse } from './auth';

export type MovementType = 'IN' | 'OUT';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  createdById: string;
  createdAt: string;
  createdBy: {
    name: string;
    role: string;
  };
}

export interface ProductDetail extends Product {
  stockMovements: StockMovement[];
}

export interface ProductListResponse {
  products: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockStatus?: 'InStock' | 'LowStock' | 'OutOfStock' | '';
}

export type CreateProductRequest = Omit<Product, 'id' | 'currentStock' | 'createdAt' | 'updatedAt'>;
export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface AddMovementRequest {
  movementType: MovementType;
  quantity: number;
  reason: string;
}

export async function getProductsApi(query: ProductQuery = {}): Promise<ProductListResponse> {
  const res = await api.get<ApiResponse<Product[]> & { meta?: ProductListResponse['meta'] }>('/products', { params: query });
  return {
    products: res.data.data || [],
    meta: res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export async function getProductByIdApi(id: string): Promise<ProductDetail> {
  const res = await api.get<ApiResponse<ProductDetail>>(`/products/${id}`);
  return res.data.data;
}

export async function createProductApi(data: CreateProductRequest): Promise<Product> {
  const res = await api.post<ApiResponse<Product>>('/products', data);
  return res.data.data;
}

export async function updateProductApi(id: string, data: UpdateProductRequest): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
  return res.data.data;
}

export async function addStockMovementApi(productId: string, data: AddMovementRequest): Promise<StockMovement> {
  const res = await api.post<ApiResponse<StockMovement>>(`/products/${productId}/movements`, data);
  return res.data.data;
}
