import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product/product-detail-view";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://divine-you-web.onrender.com"}/api`;

// Helper function to convert string or array into string[]
const formatToArray = (val: any, fallback: string[]): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim().length > 0) {
    return val.includes(",")
      ? val.split(",").map((item) => item.trim())
      : [val.trim()];
  }
  return fallback;
};

// Server-side fetch helper for current product + recommended items
async function getProductAndRecommendedFromBackend(id: string) {
  try {
    const [productRes, allRes] = await Promise.all([
      fetch(`${API_URL}/products/${id}`, { cache: "no-store" }),
      fetch(`${API_URL}/products`, { cache: "no-store" }),
    ]);

    if (!productRes.ok) return { product: null, recommended: [] };

    const productData = await productRes.json();
    const rawProduct = productData.product || productData;

    if (!rawProduct || !rawProduct.id) return { product: null, recommended: [] };

    let allProducts: any[] = [];
    if (allRes.ok) {
      const allData = await allRes.json();
      allProducts = allData.products || allData || [];
    }

    // Pass ALL remaining products (excluding current one)
    const recommended = allProducts.filter(
      (p: any) => String(p.id) !== String(rawProduct.id)
    );

    const ingredientsList = formatToArray(rawProduct.ingredients, [
      "100% Pure, sustainably sourced herbs",
      "Organically processed with zero added preservatives",
    ]);

    const benefitsList = formatToArray(rawProduct.benefits, [
      "Supports daily vitality and natural body balance",
      "Boosts overall immunity and stamina",
    ]);

    const howToUseList = formatToArray(rawProduct.how_to_use || rawProduct.howToUse, [
      "Mix 1/2 teaspoon with warm water or milk daily",
      "Best taken in the morning or as directed by practitioner",
    ]);

    const shippingList = formatToArray(
      rawProduct.shipping_returns || rawProduct.shippingReturns || rawProduct.shippingInfo || rawProduct.shipping,
      [
        "Free express shipping on all orders over ₹999",
        "30-day hassle-free returns & replacement policy",
      ]
    );

    const formattedProduct = {
      ...rawProduct,
      id: String(rawProduct.id),
      title: rawProduct.title || rawProduct.name || "Ayurvedic Product",
      image:
        rawProduct.image ||
        rawProduct.image_url ||
        (Array.isArray(rawProduct.images) && rawProduct.images[0]) ||
        "https://images.unsplash.com/photo-1608248597261-07386d30492c?auto=format&fit=crop&q=80&w=800",
      price: Number(rawProduct.price || 0),
      originalPrice: rawProduct.compare_at_price || rawProduct.originalPrice,
      detailsDescription: rawProduct.description || rawProduct.detailsDescription || "",
      weight: rawProduct.weight || "100g",

      ingredients: ingredientsList,
      benefits: benefitsList,
      howToUse: howToUseList,
      how_to_use: howToUseList,
      shippingInfo: shippingList,
      shippingReturns: shippingList,
      shipping_returns: shippingList,
    };

    return { product: formattedProduct, recommended };
  } catch (error) {
    console.error("Error fetching product on server:", error);
    return { product: null, recommended: [] };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;

  if (!productId) notFound();

  const { product, recommended } = await getProductAndRecommendedFromBackend(productId);
  if (!product) notFound();

  return <ProductDetailView product={product} recommendedProducts={recommended} />;
}