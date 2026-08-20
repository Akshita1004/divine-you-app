"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ui/product-card";
import { productService, Product } from "@/services/productService";

export function CollectionsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHerbalCollections = async () => {
      try {
        setLoading(true);
        const data = await productService.getAllProducts();
        const list = data.products || data || [];
        setProducts(list);
      } catch (err) {
        console.error("Failed to fetch herbal collections:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHerbalCollections();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    
    // Scroll by 1 card width or whole view
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
    <section id="best-sellers" className="bg-cream py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="text-left max-w-xl">
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-foreground">
              Our Herbal Collections
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
              Small batches, real ingredients — the jars our customers reorder most.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto">
            <Link
              href="/shop"
              className="group flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-forest transition-colors mr-2"
            >
              <span>View All</span>
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous products"
              className="group flex h-11 w-11 items-center justify-center rounded-full bg-card border border-border text-foreground hover:border-forest transition-all duration-200 cursor-pointer active:scale-95 shadow-xs"
            >
              <svg 
                className="w-4 h-4 transition-colors duration-200 stroke-foreground group-hover:stroke-forest" 
                fill="none" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next products"
              className="group flex h-11 w-11 items-center justify-center rounded-full bg-card border border-border text-foreground hover:border-forest transition-all duration-200 cursor-pointer active:scale-95 shadow-xs"
            >
              <svg 
                className="w-4 h-4 transition-colors duration-200 stroke-foreground group-hover:stroke-forest" 
                fill="none" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#285538] border-t-transparent mb-3" />
            <p className="text-xs text-muted-foreground">Loading herbal collections...</p>
          </div>
        ) : (
          /* Smooth Horizontal Scrollable Carousel Container */
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[280px] sm:w-[300px] lg:w-[calc(25%-18px)] shrink-0 snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}