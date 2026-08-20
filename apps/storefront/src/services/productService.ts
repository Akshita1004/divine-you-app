import API from "@/lib/api";

export interface Product {
  id: string | number;
  name: string;
  slug?: string;
  title?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  image_url?: string;
  images?: string[];
  stock?: number;
  inStock?: boolean;
  is_featured?: boolean;
  rating?: number;
  stars?: number;
  reviews_count?: number;
  reviewsCount?: number;
}

export const productService = {
  // 1. Fetch All Products (with cache busting)
  getAllProducts: async (params?: { category?: string; featured?: boolean; limit?: number }) => {
    const response = await API.get("/products", {
      params: {
        ...params,
        _t: Date.now(),
      },
    });
    return response.data;
  },

  // 2. Fetch Single Product Details
  getProductByIdentifier: async (identifier: string | number) => {
    const response = await API.get(`/products/${identifier}`);
    return response.data;
  },

  // 3. Submit Review for Product
  addReview: async (
    productId: string | number,
    reviewData: { user_name?: string; rating: number; comment: string }
  ) => {
    const response = await API.post(`/products/${productId}/reviews`, reviewData);
    return response.data;
  },
};

export default productService;