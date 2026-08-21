"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ChevronDown, SlidersHorizontal, Check, SearchX } from "lucide-react";

import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/ui/product-card";
import { productService, Product } from "@/services/productService";

interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  display_order?: number;
  is_active?: boolean;
}

const sortOptions = [
  "Featured",
  "Price: Low to High",
  "Price: High to Low",
  "Alphabetical",
];

// Helper: Ranks Top 4 Bestsellers strictly by rating/review value
function enrichProductsWithBadges(items: any[]): any[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  // 1. Filter out products with rating <= 0 before finding top 4
  const validForBestseller = items.filter((p: any) => {
    const rating = parseFloat(String(p.rating ?? p.ratings ?? p.average_rating ?? p.avg_rating ?? p.stars ?? 0)) || 0;
    return rating > 0;
  });

  // 2. Sort the valid products by rating in descending order
  const sortedByRating = [...validForBestseller].sort((a: any, b: any) => {
    const rA = parseFloat(String(a.rating ?? a.ratings ?? a.average_rating ?? a.avg_rating ?? a.stars ?? 0)) || 0;
    const rB = parseFloat(String(b.rating ?? b.ratings ?? b.average_rating ?? b.avg_rating ?? b.stars ?? 0)) || 0;
    return rB - rA;
  });

  // 3. Pick Top 4 product IDs from the highest-rated ones
  const top4Ids = sortedByRating.slice(0, 4).map((p) => String(p.id));

  // 4. Assign Badges
  return items.map((item: any) => {
    const rating = parseFloat(String(item.rating ?? item.ratings ?? item.average_rating ?? item.avg_rating ?? item.stars ?? 0)) || 0;
    
    // Bestseller: Must be in top 4 AND rating must be strictly greater than 0
    const isBestseller = top4Ids.includes(String(item.id)) && rating > 0;

    // New: If not bestseller, check if created within last 30 days
    const createdAtTime = item.created_at ? new Date(item.created_at).getTime() : null;
    const isWithin30Days = createdAtTime ? Date.now() - createdAtTime <= 30 * 24 * 60 * 60 * 1000 : false;
    const isNew = !isBestseller && isWithin30Days;

    return {
      ...item,
      is_bestseller: isBestseller,
      is_new: isNew,
    };
  });
}

function ShopAllContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "";

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [selectedSort, setSelectedSort] = useState("Featured");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [maxPrice, setMaxPrice] = useState(5000);
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  // Fetch Products & Categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // 1. Fetch Products
        const prodData = await productService.getAllProducts();
        let fetchedProducts: Product[] = [];
        if (prodData && Array.isArray((prodData as any).products)) {
          fetchedProducts = (prodData as any).products;
        } else if (Array.isArray(prodData)) {
          fetchedProducts = prodData;
        }

        // 2. Rank Top 4 based on rating column
        const rankedProducts = enrichProductsWithBadges(fetchedProducts);
        setProducts(rankedProducts);

        // 3. Fetch Categories
        let loadedCats: CategoryItem[] = [];
        if ((productService as any).getAllCategories) {
          const res = await (productService as any).getAllCategories();
          loadedCats = Array.isArray(res) ? res : res.categories || [];
        } else {
          const rawCats = Array.from(
            new Set(fetchedProducts.map((p) => p.category?.trim()).filter(Boolean))
          );

          loadedCats = rawCats.map((cat) => {
            const c = cat as string;
            if (c.toLowerCase() === "powders" || c.toLowerCase() === "herbal-powders") {
              return { name: "Herbal Powders", slug: "herbal-powders", display_order: 4 };
            }
            return { name: c, slug: c.toLowerCase().replace(/\s+/g, "-"), display_order: 99 };
          });
        }

        const activeSortedCats = loadedCats
          .filter((c) => c.is_active !== false)
          .sort((a, b) => (a.display_order || 99) - (b.display_order || 99));

        setCategoriesList(activeSortedCats);
      } catch (err: any) {
        console.error("Failed to fetch shop data:", err);
        setError("Unable to load products. Please ensure backend server is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // URL Category sync
  useEffect(() => {
    if (urlCategory) {
      const matched = categoriesList.find(
        (c) =>
          c.slug.toLowerCase() === urlCategory.toLowerCase() ||
          c.name.toLowerCase() === urlCategory.toLowerCase() ||
          (urlCategory.toLowerCase() === "powders" && c.slug === "herbal-powders")
      );
      setSelectedCategory(matched ? matched.name : urlCategory);
    } else {
      setSelectedCategory("All categories");
    }
  }, [urlCategory, categoriesList]);

  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  // Click outside to close dropdowns
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
        setIsSortOpen(false);
        setIsPriceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All categories");
    setSelectedSort("Featured");
    setMaxPrice(5000);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        const productTitle = (p.title || p.name || "").toLowerCase();
        const productDesc = (p.description || "").toLowerCase();
        const productCat = (p.category || "").toLowerCase().trim();
        const numericPrice = typeof p.price === "string" ? parseFloat(p.price) : Number(p.price || 0);

        const matchesSearch =
          !q ||
          productTitle.includes(q) ||
          productDesc.includes(q) ||
          productCat.includes(q);

        let matchesCat = selectedCategory === "All categories";
        if (!matchesCat) {
          const selLower = selectedCategory.toLowerCase().trim();
          if (selLower === "herbal powders" || selLower === "powders") {
            matchesCat = productCat === "herbal powders" || productCat === "powders" || productCat === "herbal-powders";
          } else {
            matchesCat = productCat === selLower || productCat === selLower.replace(/\s+/g, "-");
          }
        }

        const matchesPrice = numericPrice <= maxPrice;

        return matchesSearch && matchesCat && matchesPrice;
      })
      .sort((a, b) => {
        const priceA = typeof a.price === "string" ? parseFloat(a.price) : Number(a.price || 0);
        const priceB = typeof b.price === "string" ? parseFloat(b.price) : Number(b.price || 0);
        const titleA = a.title || a.name || "";
        const titleB = b.title || b.name || "";

        if (selectedSort === "Price: Low to High") return priceA - priceB;
        if (selectedSort === "Price: High to Low") return priceB - priceA;
        if (selectedSort === "Alphabetical") return titleA.localeCompare(titleB);
        return 0;
      });
  }, [products, searchQuery, selectedCategory, maxPrice, selectedSort]);

  const displayCategoryNames = [
    "All categories",
    ...Array.from(new Set(categoriesList.map((c) => c.name))),
  ];

  return (
    <main className="min-h-screen bg-[#f7f3eb] text-[#243126]">
      <TrustBar />
      <Header />

      {/* Collection Hero Banner */}
      <section className="bg-[#f2eee5] py-12 px-6 lg:px-12 border-b border-[#e6e0d3]">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#38553d]">
            THE COLLECTION
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[48px] font-normal tracking-[-0.02em] text-[#282723] mt-2">
            {selectedCategory === "All categories" ? "Shop All" : selectedCategory}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#605d54] max-w-2xl">
            Ayurvedic powders, superfoods and botanical care — made in small batches.
          </p>
        </div>
      </section>

      {/* Controls Bar */}
      <section className="pt-8 pb-4 px-6 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#807d73]" />
              <input
                type="text"
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#ded8ca] bg-[#fbf9f3] pl-10 pr-3.5 py-2 text-xs sm:text-sm text-[#243126] placeholder:text-[#807d73] focus:border-[#285538] focus:bg-white outline-none transition"
              />
            </div>

            {/* Custom Dropdowns */}
            <div ref={filterRef} className="flex flex-wrap items-center gap-2.5">
              
              {/* Category Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryOpen(!isCategoryOpen);
                    setIsSortOpen(false);
                    setIsPriceOpen(false);
                  }}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2 text-xs text-[#243126] hover:border-[#285538] transition cursor-pointer shadow-2xs min-w-[155px]"
                >
                  <span className="whitespace-nowrap">{selectedCategory}</span>
                  <ChevronDown
                    size={14}
                    className={`text-[#66655d] shrink-0 transition-transform duration-200 ${
                      isCategoryOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`absolute left-0 top-full mt-1.5 z-30 w-52 rounded-xl border border-[#ded8ca] bg-[#fbf9f3] p-1.5 shadow-lg space-y-0.5 transition-all duration-200 origin-top-left max-h-60 overflow-y-auto ${
                    isCategoryOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  {displayCategoryNames.map((category) => {
                    const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs transition cursor-pointer text-left ${
                          isSelected
                            ? "bg-[#d8e6d7] text-[#243126] font-medium"
                            : "text-[#243126] hover:bg-[#f3efe6]"
                        }`}
                      >
                        <span className="whitespace-nowrap">{category}</span>
                        {isSelected && <Check size={14} className="text-[#243126] shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsSortOpen(!isSortOpen);
                    setIsCategoryOpen(false);
                    setIsPriceOpen(false);
                  }}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2 text-xs text-[#243126] hover:border-[#285538] transition cursor-pointer shadow-2xs min-w-[140px]"
                >
                  <span className="whitespace-nowrap">{selectedSort}</span>
                  <ChevronDown
                    size={14}
                    className={`text-[#66655d] shrink-0 transition-transform duration-200 ${
                      isSortOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`absolute left-0 top-full mt-1.5 z-30 w-52 rounded-xl border border-[#ded8ca] bg-[#fbf9f3] p-1.5 shadow-lg space-y-0.5 transition-all duration-200 origin-top-left ${
                    isSortOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  {sortOptions.map((option) => {
                    const isSelected = selectedSort === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSelectedSort(option);
                          setIsSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs transition cursor-pointer text-left ${
                          isSelected
                            ? "bg-[#d8e6d7] text-[#243126] font-medium"
                            : "text-[#243126] hover:bg-[#f3efe6]"
                        }`}
                      >
                        <span className="whitespace-nowrap">{option}</span>
                        {isSelected && <Check size={14} className="text-[#243126] shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Slider Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsPriceOpen(!isPriceOpen);
                    setIsCategoryOpen(false);
                    setIsSortOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-[#ded8ca] bg-[#fbf9f3] px-3.5 py-2 text-xs sm:text-[13px] text-[#243126] hover:border-[#285538] transition cursor-pointer shadow-2xs"
                >
                  <SlidersHorizontal size={14} className="text-[#243126]" />
                  <span>Price</span>
                </button>

                <div
                  className={`absolute right-0 top-full mt-1.5 z-30 w-56 rounded-xl border border-[#ded8ca] bg-[#fbf9f3] p-4 shadow-xl transition-all duration-200 origin-top-right ${
                    isPriceOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <h4 className="font-serif text-base text-[#243126] font-normal">
                    Maximum price
                  </h4>
                  <p className="mt-0.5 text-xs text-[#66655d]">
                    Up to ₹{maxPrice.toLocaleString("en-IN")}
                  </p>

                  <div className="mt-4">
                    <input
                      type="range"
                      min={100}
                      max={5000}
                      step={100}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#ded8ca] rounded-lg appearance-none cursor-pointer accent-[#285538]"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-6 text-xs text-[#77756c]">
            {loading
              ? "Loading products from backend..."
              : `Showing ${filteredProducts.length} of ${products.length} products`}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="pb-20 px-6 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#285538] border-t-transparent mb-3" />
              <p className="text-xs sm:text-sm text-[#66655d]">Fetching products from server...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs sm:text-sm text-red-700">
              {error}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-2 rounded-3xl border border-[#ded8ca]/80 bg-[#fbf9f3] py-16 px-6 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#d8e6d7] text-[#285538] mb-5">
                <SearchX size={22} strokeWidth={1.8} />
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">
                No products match your filters
              </h3>

              <p className="mt-2.5 text-xs sm:text-sm text-[#66655d] leading-relaxed max-w-md mx-auto">
                Try a different search term, widen your price range, or browse all categories.
              </p>

              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-6 inline-flex items-center justify-center rounded-xl border border-[#ded8ca] bg-[#f3efe6] px-5 py-2.5 text-xs font-medium text-[#243126] hover:bg-[#d8e6d7] hover:border-[#c5d8c3] transition-all duration-200 cursor-pointer shadow-2xs"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

export function ShopAllView() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f3eb]" />}>
      <ShopAllContent />
    </Suspense>
  );
}