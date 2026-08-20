"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/ui/product-card";
import { productService, Product } from "@/services/productService";

interface BestSellersViewProps {
  products?: Product[];
}

export function BestSellersView({ products: initialProducts }: BestSellersViewProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts || initialProducts.length === 0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        if (!initialProducts || initialProducts.length === 0) {
          setLoading(true);
          const data = await productService.getAllProducts();
          const list = data.products || data || [];
          if (isMounted) setProducts(list);
        }
      } catch (err) {
        console.error("Failed to fetch best sellers:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // PURE DYNAMIC SORTING (No Hardcoded Titles / Fixed Values)
  const top4BestSellers = useMemo(() => {
    const parseRating = (item: any): number => {
      const val =
        item.rating ??
        item.stars ??
        item.average_rating ??
        item.avg_rating ??
        item.rating_avg;

      if (val !== undefined && val !== null && val !== "") {
        const parsed = typeof val === "string" ? parseFloat(val) : Number(val);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }

      // Calculate rating directly from reviews array if backend passes reviews
      if (Array.isArray(item.reviews) && item.reviews.length > 0) {
        const sum = item.reviews.reduce(
          (acc: number, r: any) => acc + Number(r.rating || r.stars || 0),
          0
        );
        return sum / item.reviews.length;
      }

      return 0;
    };

    const parseReviewsCount = (item: any): number => {
      const val =
        item.reviews_count ??
        item.reviewsCount ??
        item.num_reviews ??
        item.review_count ??
        item.reviews;

      if (val !== undefined && val !== null && val !== "") {
        const parsed = typeof val === "string" ? parseInt(val, 10) : Number(val);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }

      if (Array.isArray(item.reviews)) {
        return item.reviews.length;
      }

      return 0;
    };

    return [...products]
      .sort((a, b) => {
        const ratingA = parseRating(a);
        const ratingB = parseRating(b);

        // Priority 1: Highest Rating First (5.0 -> 4.5 -> 4.0 -> 3.5 -> 2.0)
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }

        // Priority 2: Higher Review Count
        return parseReviewsCount(b) - parseReviewsCount(a);
      })
      .slice(0, 4); // Pick strictly Top 4
  }, [products]);

  const scrollExplore = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;

    const scrollAmount = clientWidth * 0.75;
    const targetScroll =
      direction === "left"
        ? scrollLeft - scrollAmount
        : scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen bg-[#fbf9f3] text-[#243126] flex flex-col justify-between font-sans">
      <div>
        <TrustBar />
        <Header />

        {/* Hero Banner Section */}
        <section className="bg-[#f3efe6]/60 border-b border-[#ded8ca]/60 py-12 sm:py-16 px-6 lg:px-12">
          <div className="mx-auto max-w-7xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#66655d]">
              MOST LOVED
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[52px] font-normal tracking-[-0.015em] text-[#243126]">
              Best Sellers
            </h1>
            <p className="text-xs sm:text-sm text-[#66655d] max-w-xl leading-relaxed pt-1">
              The formulations our community returns to season after season.
            </p>
          </div>
        </section>

        {/* Primary Best Sellers Grid (Live Dynamic Top 4) */}
        <section className="mx-auto max-w-7xl px-6 lg:px-12 py-12 sm:py-16">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#285538] border-t-transparent mb-3" />
              <p className="text-xs text-[#66655d]">Loading best sellers...</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {top4BestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* "Keep Exploring" Section (UNTOUCHED) */}
        <section className="border-y border-[#ded8ca]/80 py-14 px-6 lg:px-12 bg-[#f3efe6]/60 mb-10 sm:mb-16 overflow-hidden">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#243126]">
                  Keep exploring
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#66655d]">
                  Pair your favourites with the rest of the Divine You range.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href="/shop"
                  className="flex items-center gap-1.5 text-xs font-medium text-[#243126] hover:text-[#285538] transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollExplore("left")}
                    aria-label="Previous"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ded8ca] bg-white/80 text-[#243126] hover:bg-white transition-all duration-200 cursor-pointer active:scale-90 shadow-xs"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollExplore("right")}
                    aria-label="Next"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ded8ca] bg-white/80 text-[#243126] hover:bg-white transition-all duration-200 cursor-pointer active:scale-90 shadow-xs"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Explore Scrollable Slider */}
            {loading ? (
              <div className="py-12 text-center text-xs text-[#66655d]">
                Loading range...
              </div>
            ) : (
              <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 snap-x snap-mandatory pt-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {products.map((product) => (
                  <div
                    key={`explore-${product.id}`}
                    className="w-[280px] sm:w-[300px] lg:w-[calc(25%-18px)] shrink-0 snap-start"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}