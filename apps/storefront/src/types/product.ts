export interface Product {
  id: string | number;
  name?: string;
  title?: string;
  description?: string;
  price: number | string;
  compareAtPrice?: number | string;
  originalPrice?: number | string | null; // Added for products-data & UI compatibility
  category?: string;
  image?: string;        
  image_url?: string;    
  images?: string[];
  stock?: number;
  is_featured?: boolean;
  rating?: number;
  reviewsCount?: number;
  badge?: string | null;
  weight?: string;
  detailsDescription?: string;
  ingredients?: string[];
  benefits?: string[];
  howToUse?: string[];
  shippingInfo?: string[];
}

// Added for productService.ts
export interface ProductsResponse {
  products: Product[];
  total?: number;
  count?: number;
}