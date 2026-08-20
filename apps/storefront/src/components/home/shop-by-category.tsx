"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Superfoods",
    slug: "Superfoods",
    description: "Leaf and root nutrition, simply made",
    image_url: "https://ljpyjuifueyxrkywvlns.supabase.co/storage/v1/object/public/Categories/superfoodss.png",
    display_order: 1,
  },
  {
    id: "2",
    name: "Daily Wellness",
    slug: "Daily Wellness",
    description: "Rituals for a steady, grounded routine",
    image_url: "https://ljpyjuifueyxrkywvlns.supabase.co/storage/v1/object/public/Categories/daily-wellness.png",
    display_order: 2,
  },
  {
    id: "3",
    name: "Skin & Body",
    slug: "Skin & Body",
    description: "Gentle botanical care, every day",
    image_url: "https://ljpyjuifueyxrkywvlns.supabase.co/storage/v1/object/public/Categories/skin-and-body.png",
    display_order: 3,
  },
  {
    id: "4",
    name: "Powders",
    slug: "Powders",
    description: "Finely milled classical formulations",
    image_url: "https://ljpyjuifueyxrkywvlns.supabase.co/storage/v1/object/public/Categories/powder.png",
    display_order: 4,
  },
];

export function ShopByCategory() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (isMounted && !error && data && data.length > 0) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="w-full bg-[#FDFBF7] py-12 sm:py-16 font-sans border-b border-[#E2DAD0]/40 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 flex flex-col lg:flex-row items-start gap-8 lg:gap-10 xl:gap-14">
        
        {/* LEFT FIXED TEXT COLUMN */}
        <div className="w-full lg:w-[220px] xl:w-[230px] shrink-0 space-y-5 pt-2">
          <div className="space-y-2.5">
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1A19] leading-tight whitespace-nowrap">
              Shop by Category
            </h2>
            <p className="text-xs sm:text-sm text-[#7D7871] leading-relaxed">
              Everything you need for a grounded, unhurried wellness routine.
            </p>
          </div>

          <div className="pt-1">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#1C1A19] hover:text-[#1D3B28] transition group whitespace-nowrap"
            >
              <span>View All Products</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* RIGHT CARDS CAROUSEL CONTAINER (Dynamic Container Size) */}
        <div 
          className="w-full flex-1 min-w-0 overflow-x-auto scroll-smooth pb-2 pt-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ containerType: "inline-size" }}
        >
          <div className="flex gap-4 w-max">
            {categories.map((cat) => (
              <Link
                key={cat.id || cat.slug}
                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#EBE5DA] bg-white transition-all duration-300 hover:shadow-lg w-[210px] sm:w-[230px] lg:w-[calc((100cqw-48px)/4)] shrink-0 snap-start"
              >
                {/* Image Box */}
                <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-[#F4F0E8]">
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Card Info Section */}
                <div className="p-4 sm:p-5 text-center space-y-1.5 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-normal text-[#1C1A19] group-hover:text-[#1D3B28] transition leading-snug">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-[11px] text-[#7D7871] line-clamp-2 mt-1 leading-relaxed px-1">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#1C1A19] group-hover:text-[#1D3B28] transition">
                    <span>SHOP NOW</span>
                    <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}