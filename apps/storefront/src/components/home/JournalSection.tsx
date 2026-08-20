"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  read_time: string;
  cover_image: string;
  created_at: string;
}

export default function JournalSection() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .eq("status", "Published")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const formatted: BlogPost[] = data.map((item: any) => ({
            id: item.id,
            slug: item.slug,
            title: item.title,
            subtitle: item.subtitle || item.excerpt || "",
            category: (item.category || "JOURNAL").toUpperCase(),
            read_time: item.read_time || "5 min read",
            cover_image:
              item.cover_image ||
              "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
            created_at: new Date(item.created_at || Date.now()).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            }),
          }));
          setBlogs(formatted);
        }
      } catch (err) {
        console.error("Fetch blogs error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, []);

  const scroll = (direction: "left" | "right") => {
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
    <section className="bg-[#fbf9f3] py-16 sm:py-24 border-t border-[#e8e2d4]/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#807d73]">
              JOURNAL
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#243126] font-normal tracking-tight">
              From the Divine You Journal
            </h2>
            <p className="text-xs sm:text-sm text-[#66655d] font-light">
              Stories, rituals, ingredients and everyday inspiration for a more mindful approach to wellness.
            </p>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous articles"
              className="group flex h-11 w-11 items-center justify-center rounded-full bg-white border border-[#ded8ca] text-[#243126] hover:border-[#285538] transition-all duration-200 cursor-pointer active:scale-95 shadow-xs"
            >
              <svg
                className="w-4 h-4 transition-colors duration-200 stroke-[#243126] group-hover:stroke-[#285538]"
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
              aria-label="Next articles"
              className="group flex h-11 w-11 items-center justify-center rounded-full bg-white border border-[#ded8ca] text-[#243126] hover:border-[#285538] transition-all duration-200 cursor-pointer active:scale-95 shadow-xs"
            >
              <svg
                className="w-4 h-4 transition-colors duration-200 stroke-[#243126] group-hover:stroke-[#285538]"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Smooth Horizontal Scrollable Carousel Container */}
        {loading ? (
          <div className="p-16 flex justify-center text-[#807d73]">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : blogs.length === 0 ? (
          <div className="p-16 flex justify-center text-[#807d73] text-sm">
            More stories coming soon.
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blogs/${blog.slug}`}
                className="w-[300px] sm:w-[350px] lg:w-[calc(33.333%-16px)] shrink-0 snap-start bg-white rounded-3xl border border-[#e8e2d4]/80 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 group cursor-pointer"
              >
                <div>
                  {/* Cover Image */}
                  <div className="relative h-60 w-full overflow-hidden bg-[#f3efe6]">
                    <Image
                      src={blog.cover_image}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>

                  {/* Content Area */}
                  <div className="p-6 space-y-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#807d73] block">
                      {blog.category}
                    </span>

                    <h3 className="font-serif text-xl font-normal text-[#243126] leading-snug group-hover:text-[#285538] transition-colors line-clamp-2">
                      {blog.title}
                    </h3>

                    <p className="text-xs text-[#66655d] leading-relaxed line-clamp-2">
                      {blog.subtitle}
                    </p>
                  </div>
                </div>

                {/* Footer Meta & Action */}
                <div className="px-6 pb-6 pt-2 space-y-4">
                  <p className="text-[11px] text-[#807d73]">
                    {blog.created_at} • {blog.read_time}
                  </p>

                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[#243126] group-hover:text-[#285538] transition-colors">
                    <span>Read More</span>
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}