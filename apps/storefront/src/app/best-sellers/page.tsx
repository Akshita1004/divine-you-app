import { BestSellersView } from "@/components/best-sellers/best-sellers-view";

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api";

async function getBestSellersFromBackend() {
  try {
    const res = await fetch(`${API_URL}/products`, {
      cache: "no-store", // Ensures fresh data on every page view
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.products || data || [];
  } catch (error) {
    console.error("Error fetching best sellers on server:", error);
    return [];
  }
}

export default async function BestSellersPage() {
  const products = await getBestSellersFromBackend();

  return <BestSellersView products={products} />;
}