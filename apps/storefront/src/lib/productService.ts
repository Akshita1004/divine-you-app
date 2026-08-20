import API from './api';
import { Product, ProductsResponse } from '../types/product';

// 1. Fetch All Products
export const fetchProducts = async (category: string = ''): Promise<ProductsResponse> => {
  const url = category ? `/products?category=${encodeURIComponent(category)}` : '/products';
  const response = await API.get<ProductsResponse>(url);
  return response.data;
};

// 2. Fetch Single Product Details
export const fetchProductById = async (id: string): Promise<{ product: Product }> => {
  const response = await API.get<{ product: Product }>(`/products/${id}`);
  return response.data;
};