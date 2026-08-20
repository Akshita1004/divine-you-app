"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Product } from "@/types/product";
import { useCart } from "@/context/cart-context";
import { ProductRatingBadge } from "@/components/product/ProductRatingBadge";

interface ProductCardProps {
  product: Product | any;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const imageSrc =
    product?.image ||
    product?.image_url ||
    (Array.isArray(product?.images) && product.images.length > 0
      ? product.images[0]
      : null) ||
    "https://images.unsplash.com/photo-1608248597261-07386d30492c?auto=format&fit=crop&q=80&w=800";

  const title = product?.title || product?.name || "Ayurvedic Product";
  const description =
    product?.description ||
    product?.detailsDescription ||
    "Himalayan-sourced herbal formulation for daily wellness.";
  const price = Number(product?.price || 0);
  const originalPrice = product?.originalPrice || product?.compare_at_price;

  // Live Stock Check
  const stockCount = Number(
    product?.stock_quantity ?? product?.stock ?? product?.quantity ?? 50
  );
  const isOutOfStock = stockCount <= 0;

  // Rating & Review Value
  const ratingValue = parseFloat(
    String(product?.rating ?? product?.average_rating ?? product?.stars ?? 0)
  ) || 0;

  // ==========================================
  // TRANSLUCENT DYNAMIC BADGE LOGIC
  // ==========================================
  const getDynamicBadge = () => {
    // 1. OUT OF STOCK (Priority 1 - Translucent Red)
    if (isOutOfStock) {
      return {
        label: "OUT OF STOCK",
        className: "bg-[#FCE8E8]/90 text-[#984242] border-[#F2C2C2]/80 backdrop-blur-md",
      };
    }

    // 2. BESTSELLER (Priority 2 - Translucent Frosted Glass)
    const isBestseller =
      product?.is_bestseller === true ||
      ratingValue >= 3.5 ||
      String(product?.badge || "").toUpperCase().trim() === "BESTSELLER";

    if (isBestseller) {
      return {
        label: "BESTSELLER",
        className: "bg-[#FDFBF7]/85 text-[#243126] border-[#ded8ca]/80 backdrop-blur-md shadow-2xs",
      };
    }

    // 3. NEW (Priority 3 - Only within 30 days; disappears after 30 days)
    const createdAtTime = product?.created_at ? new Date(product.created_at).getTime() : null;
    const isUnder30Days = createdAtTime
      ? Date.now() - createdAtTime <= 30 * 24 * 60 * 60 * 1000
      : false;

    const isExplicitNew =
      product?.is_new === true ||
      String(product?.badge || "").toUpperCase().trim() === "NEW";

    if (isUnder30Days || isExplicitNew) {
      return {
        label: "NEW",
        className: "bg-[#FDFBF7]/85 text-[#243126] border-[#ded8ca]/80 backdrop-blur-md shadow-2xs",
      };
    }

    // 4. Greater than 30 days & Not Bestseller -> Disappear (No badge)
    return null;
  };

  const badge = getDynamicBadge();

  return (
    <div className="group flex flex-col justify-between h-full w-full bg-[#fbf9f3] rounded-[22px] border border-[#e8e2d4] overflow-hidden shadow-xs transition-all duration-300 hover:shadow-md">
      
      {/* Image with Translucent Badge */}
      <Link
        href={`/product/${product.id}`}
        className="relative w-full aspect-square overflow-hidden bg-[#f3efe6] block shrink-0"
      >
        {badge && (
          <span
            className={`absolute top-3 left-3 z-10 rounded-md px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold tracking-[0.18em] uppercase border ${badge.className}`}
          >
            {badge.label}
          </span>
        )}

        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
            isOutOfStock ? "grayscale contrast-75 opacity-70" : ""
          }`}
        />
      </Link>

      {/* Details Section */}
      <div className="p-5 flex flex-col justify-between flex-1 text-left space-y-3">
        <div className="space-y-1.5">
          <Link href={`/product/${product.id}`}>
            <h3 className="font-serif text-[18px] font-normal text-[#2d2a26] leading-snug hover:text-[#285538] transition-colors line-clamp-2 min-h-[52px]">
              {title}
            </h3>
          </Link>

          <p className="text-[13px] text-[#6a6861] leading-relaxed line-clamp-2 min-h-[38px]">
            {description}
          </p>

          <div className="pt-1">
            <ProductRatingBadge productId={String(product.id)} />
          </div>
        </div>

        {/* Price & Add Button */}
        <div className="mt-auto pt-3 flex items-end justify-between border-t border-[#e8e2d4]/60">
          <div>
            <div className="text-base font-bold text-[#243126]">
              ₹{price.toLocaleString("en-IN")}
            </div>
            {originalPrice && (
              <div className="text-xs text-[#8c8a81] line-through mt-0.5">
                ₹{Number(originalPrice).toLocaleString("en-IN")}
              </div>
            )}
            {product?.weight && (
              <div className="text-[11px] text-[#77756c] mt-0.5">
                {String(product.weight).toLowerCase()}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            aria-label={isOutOfStock ? "Out of Stock" : `Add ${title} to cart`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isOutOfStock) return;
              addToCart({
                ...product,
                title,
                image: imageSrc,
                price,
              });
            }}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all shadow-2xs ${
              isOutOfStock
                ? "bg-[#EAE4D8] text-[#9C978E] cursor-not-allowed border border-[#DDD5C5]"
                : "bg-[#285538] text-white hover:bg-[#1f462c] hover:scale-105 active:scale-95 cursor-pointer"
            }`}
          >
            <Plus size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

    </div>
  );
}