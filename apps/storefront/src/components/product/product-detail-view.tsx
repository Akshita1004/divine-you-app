"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { ProductCard } from "@/components/ui/product-card";
import ReviewSection from "@/components/product/ReviewSection";
import { ProductRatingBadge } from "@/components/product/ProductRatingBadge";
import { useCart } from "@/context/cart-context";
import { productService } from "@/services/productService";

interface ProductDetailViewProps {
  product: any;
  recommendedProducts?: any[];
}

export function ProductDetailView({ product, recommendedProducts: initialRecommended }: ProductDetailViewProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, openCart } = useCart();
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>(initialRecommended || []);

  // Live Stock Calculation
  const availableStock = Number(
    product?.stock_quantity ?? product?.stock ?? product?.quantity ?? 50
  );
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;

  // Accordion State
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    ingredients: true,
    benefits: false,
    howToUse: false,
    shipping: false,
  });

  // Dynamic Fetch Fallback for "You May Also Like"
  useEffect(() => {
    if (initialRecommended && initialRecommended.length > 0) {
      setRecommendedProducts(initialRecommended);
      return;
    }

    const fetchRecommended = async () => {
      try {
        const data = await productService.getAllProducts();
        const list = data.products || data || [];
        const filtered = list.filter((p: any) => String(p.id) !== String(product?.id));
        setRecommendedProducts(filtered);
      } catch (err) {
        console.error("Failed to fetch recommended products:", err);
      }
    };

    if (product?.id) {
      fetchRecommended();
    }
  }, [product?.id, initialRecommended]);

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Regular Add to Cart: Adds item and opens the Cart Drawer
  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity, true);
    openCart();
  };

  // Direct Buy Now: Adds item silently WITHOUT opening Cart Drawer & redirects to /checkout
  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity, false);
    router.push("/checkout");
  };

  const imageSrc =
    product?.image ||
    product?.image_url ||
    (Array.isArray(product?.images) && product.images[0]) ||
    "https://images.unsplash.com/photo-1608248597261-07386d30492c?auto=format&fit=crop&q=80&w=800";

  const ingredientsList = Array.isArray(product?.ingredients)
    ? product.ingredients
    : [product?.ingredients || "100% Organic Pure Ingredients"];

  const benefitsList = Array.isArray(product?.benefits)
    ? product.benefits
    : [product?.benefits || "Supports daily vitality & holistic health"];

  const howToUseList = Array.isArray(product?.howToUse)
    ? product.howToUse
    : Array.isArray(product?.how_to_use)
    ? product.how_to_use
    : [product?.howToUse || product?.how_to_use || "Mix 1 tsp in warm water daily"];

  const shippingInfoList = Array.isArray(product?.shippingInfo)
    ? product.shippingInfo
    : Array.isArray(product?.shipping_returns)
    ? product.shipping_returns
    : Array.isArray(product?.shippingReturns)
    ? product.shippingReturns
    : ["Free shipping over ₹999", "30-day easy returns & replacement policy"];

  return (
    <main className="min-h-screen bg-[#f7f3eb] text-[#243126]">
      <TrustBar />
      <Header />
      <CartDrawer />

      {/* Main Product Container */}
      <div className="mx-auto max-w-7xl px-6 lg:px-12 py-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#77756c] mb-8">
          <Link href="/" className="hover:text-[#285538] transition-colors">
            Home
          </Link>
          <span>›</span>
          <Link href="/shop" className="hover:text-[#285538] transition-colors">
            Shop
          </Link>
          <span>›</span>
          <span className="text-[#243126] font-medium">{product?.title || product?.name}</span>
        </nav>

        {/* Top Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start pb-16">
          
          {/* Left: Product Image */}
          <div className="lg:col-span-6">
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[#f3efe6] border border-[#ded8ca]/80 shadow-xs">
              <Image
                src={imageSrc}
                alt={product?.title || product?.name || "Product Image"}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={`object-cover transition-opacity duration-300 ${
                  isOutOfStock ? "grayscale opacity-80" : ""
                }`}
              />

              {/* Sold Out Badge on Image */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="rounded-xl bg-[#1C1A19]/90 px-4 py-2 font-serif text-sm font-semibold tracking-wider uppercase text-white shadow-lg">
                    Sold Out
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Details & Purchase Controls */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Weight Tag */}
            {product?.weight && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#66655d]">
                {product.weight}
              </p>
            )}

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-normal tracking-[-0.01em] text-[#243126] leading-tight">
              {product?.title || product?.name}
            </h1>

            {/* Dynamic Star Rating Badge */}
            <div className="pt-0.5 pb-1">
              <ProductRatingBadge productId={String(product?.id)} />
            </div>

            {/* Price & Stock Indicator */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">
                  ₹{Number(product?.price || 0).toLocaleString("en-IN")}
                </span>
                {product?.originalPrice && (
                  <span className="text-sm text-[#8c8a81] line-through">
                    ₹{Number(product.originalPrice).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#77756c]">Inclusive of all taxes</p>

              {/* Live Inventory Status Pill */}
              <div className="pt-1">
                {isOutOfStock ? (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#FCE8E8] border border-[#F2C2C2] px-3 py-1 text-xs font-semibold text-[#984242]">
                    <span className="h-2 w-2 rounded-full bg-[#984242]" />
                    <span>Out of Stock · Restocking Soon</span>
                  </div>
                ) : isLowStock ? (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF6E5] border border-[#F5DCB0] px-3 py-1 text-xs font-semibold text-[#B37410]">
                    <span className="h-2 w-2 rounded-full bg-[#B37410] animate-pulse" />
                    <span>Hurry, only {availableStock} left in stock!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#E2EBE0] border border-[#C5D8CD] px-3 py-1 text-xs font-semibold text-[#1D3B28]">
                    <span className="h-2 w-2 rounded-full bg-[#1D3B28]" />
                    <span>In Stock · Ready to Dispatch</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-[#66655d] leading-relaxed pt-1">
              {product?.detailsDescription || product?.description}
            </p>

            {/* CTA Controls */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              {/* Quantity Counter */}
              <div
                className={`flex items-center justify-between rounded-xl border border-[#ded8ca] bg-[#fbf9f3] px-3 py-2.5 min-w-[100px] ${
                  isOutOfStock ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                <button
                  type="button"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-[#66655d] hover:text-[#243126] transition cursor-pointer disabled:opacity-40"
                >
                  <Minus size={15} />
                </button>
                <span className="text-sm font-medium text-[#243126] px-3">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock || quantity >= availableStock}
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  className="text-[#66655d] hover:text-[#243126] transition cursor-pointer disabled:opacity-40"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`flex-1 min-w-[140px] rounded-xl px-6 py-3 text-sm font-semibold transition text-center shadow-xs ${
                  isOutOfStock
                    ? "bg-[#EAE4D8] text-[#8C867A] cursor-not-allowed border border-[#DDD5C5]"
                    : "bg-[#285538] text-white hover:bg-[#1f462c] cursor-pointer"
                }`}
              >
                {isOutOfStock ? "Sold Out" : "Add to Cart"}
              </button>

              {/* Buy Now Button */}
              {!isOutOfStock && (
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 min-w-[140px] rounded-xl border border-[#ded8ca] bg-[#f3efe6] px-6 py-3 text-sm font-semibold text-[#243126] hover:bg-[#e8e2d4] transition cursor-pointer text-center"
                >
                  Buy Now
                </button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#ded8ca]/80 text-xs text-[#66655d]">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-[#243126] shrink-0" />
                <span>Free shipping over ₹999</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={16} className="text-[#243126] shrink-0" />
                <span>30-day easy returns</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#243126] shrink-0" />
                <span>Secure checkout</span>
              </div>
            </div>

            {/* Expandable Accordions */}
            <div className="pt-6 border-t border-[#ded8ca]/80 divide-y divide-[#ded8ca]/80">
              {/* Ingredients */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion("ingredients")}
                  className="w-full flex items-center justify-between text-left font-serif text-lg font-normal text-[#243126] cursor-pointer"
                >
                  <span>Ingredients</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#66655d] transition-transform duration-200 ${
                      openAccordions.ingredients ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordions.ingredients && (
                  <ul className="mt-3 space-y-2 text-xs text-[#66655d] leading-relaxed list-disc list-inside pl-1">
                    {ingredientsList.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Benefits */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion("benefits")}
                  className="w-full flex items-center justify-between text-left font-serif text-lg font-normal text-[#243126] cursor-pointer"
                >
                  <span>Benefits</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#66655d] transition-transform duration-200 ${
                      openAccordions.benefits ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordions.benefits && (
                  <ul className="mt-3 space-y-2 text-xs text-[#66655d] leading-relaxed list-disc list-inside pl-1">
                    {benefitsList.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* How to Use */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion("howToUse")}
                  className="w-full flex items-center justify-between text-left font-serif text-lg font-normal text-[#243126] cursor-pointer"
                >
                  <span>How to Use</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#66655d] transition-transform duration-200 ${
                      openAccordions.howToUse ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordions.howToUse && (
                  <ul className="mt-3 space-y-2 text-xs text-[#66655d] leading-relaxed list-disc list-inside pl-1">
                    {howToUseList.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Shipping & Returns */}
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion("shipping")}
                  className="w-full flex items-center justify-between text-left font-serif text-lg font-normal text-[#243126] cursor-pointer"
                >
                  <span>Shipping & Returns</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#66655d] transition-transform duration-200 ${
                      openAccordions.shipping ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openAccordions.shipping && (
                  <ul className="mt-3 space-y-2 text-xs text-[#66655d] leading-relaxed list-disc list-inside pl-1">
                    {shippingInfoList.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Customer Review Section */}
        <div className="pt-8 pb-12 border-t border-[#ded8ca]/80">
          <ReviewSection productId={String(product?.id)} />
        </div>

        {/* Dynamic 3-Column You May Also Like Section */}
        <section className="pt-16 pb-12 border-t border-[#ded8ca]/80">
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#243126] mb-8">
            You may also like
          </h2>

          {recommendedProducts && recommendedProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedProducts.map((recProduct: any) => (
                <ProductCard key={recProduct.id} product={recProduct} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#77756c]">
              No other products available at the moment.
            </div>
          )}
        </section>

      </div>

      <Footer />
    </main>
  );
}

export default ProductDetailView;