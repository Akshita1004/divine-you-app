"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, Package } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface ReviewItem {
  id: string;
  product_id?: string;
  product_slug?: string;
  product_name?: string;
  reviewer_name: string;
  rating: number;
  title?: string;
  comment?: string;
  review?: string;
  created_at: string;
}

interface ProductGroup {
  productKey: string;
  productName: string;
  avgRating: number;
  reviews: ReviewItem[];
}

export default function AdminReviewsPage() {
  const [groupedReviews, setGroupedReviews] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  function formatProductName(str: string) {
    if (!str) return "Ayurvedic Product";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
      return "Ayurvedic Product";
    }
    return str
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  async function fetchReviews() {
    try {
      setLoading(true);

      const [reviewsRes, productsRes] = await Promise.all([
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, title"),
      ]);

      let data = reviewsRes.data || [];
      const productsData = productsRes.data || [];

      if (data.length === 0) {
        const fallbackRes = await supabase
          .from("product_reviews")
          .select("*")
          .order("created_at", { ascending: false });
        data = fallbackRes.data || [];
      }

      const productsMap = new Map<string, string>();
      productsData.forEach((p: any) => {
        if (p.id) {
          productsMap.set(p.id, p.name || p.title || "Ayurvedic Product");
        }
      });

      const groupsMap = new Map<string, ReviewItem[]>();

      data.forEach((rev: any) => {
        const rawProductId = rev.product_id || rev.product_slug || rev.product || "default";

        const realProductName =
          productsMap.get(rev.product_id) ||
          productsMap.get(rawProductId) ||
          rev.product_name ||
          formatProductName(rev.product_slug || rawProductId);

        const groupKey = rev.product_id || realProductName;

        const existing = groupsMap.get(groupKey) || [];
        existing.push({
          id: String(rev.id),
          product_id: rev.product_id,
          product_slug: rev.product_slug,
          product_name: realProductName,
          reviewer_name: rev.reviewer_name || rev.user_name || rev.name || "Anonymous",
          rating: Number(rev.rating || 5),
          title: rev.title || "",
          comment: rev.comment || rev.review || "",
          created_at: new Date(rev.created_at || Date.now()).toLocaleDateString("en-CA"),
        });

        groupsMap.set(groupKey, existing);
      });

      const formattedGroups: ProductGroup[] = Array.from(groupsMap.entries()).map(
        ([key, reviews]) => {
          const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
          const avg = Number((totalRating / reviews.length).toFixed(1));
          return {
            productKey: key,
            productName: reviews[0]?.product_name || "Ayurvedic Product",
            avgRating: avg,
            reviews,
          };
        }
      );

      setGroupedReviews(formattedGroups);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header Bar */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#243126] font-medium tracking-tight">
          Reviews
        </h1>
        <p className="text-xs sm:text-sm text-[#66655d]">
          Manage and view all customer product reviews.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e8e2d4]/80 p-16 flex justify-center text-[#807d73]">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : groupedReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e2d4]/80 p-12 text-center text-xs text-[#807d73]">
          No product reviews submitted yet.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedReviews.map((group) => (
            <div
              key={group.productKey}
              className="bg-white rounded-2xl border border-[#e8e2d4]/80 overflow-hidden shadow-none"
            >
              {/* Group Product Header */}
              <div className="bg-[#fbf9f3] p-4 sm:p-5 border-b border-[#e8e2d4]/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#f3efe6] rounded-lg border border-[#e8e2d4]/60 text-[#243126]">
                    <Package size={18} />
                  </div>
                  <div>
                    <h2 className="font-serif text-base font-medium text-[#243126]">
                      {group.productName}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#ded8ca] text-xs">
                  <div className="flex items-center text-[#285538]">
                    <Star size={13} className="fill-[#285538] stroke-none" />
                    <span className="font-semibold ml-1 text-[#243126]">{group.avgRating}</span>
                  </div>
                  <span className="text-[#807d73]">
                    ({group.reviews.length} {group.reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>

              {/* Desktop Table View (Untouched) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs text-[#243126]">
                  <thead className="bg-[#faf8f2]/50 text-[#807d73] uppercase tracking-[0.15em] text-[10px] font-semibold border-b border-[#f3efe6]">
                    <tr>
                      <th className="p-4 pl-5 font-semibold w-1/5">REVIEWER</th>
                      <th className="p-4 font-semibold w-1/6">RATING</th>
                      <th className="p-4 font-semibold">REVIEW</th>
                      <th className="p-4 pr-5 font-semibold w-1/6">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3efe6]">
                    {group.reviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-[#fbf9f3]/60 transition-colors">
                        <td className="p-4 pl-5 font-medium text-[#243126] align-top">
                          {rev.reviewer_name}
                        </td>

                        <td className="p-4 align-top">
                          <div className="flex items-center gap-0.5 text-[#285538]">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={13}
                                className={
                                  star <= rev.rating
                                    ? "fill-[#285538] stroke-none"
                                    : "text-[#ded8ca] stroke-current fill-none"
                                }
                              />
                            ))}
                          </div>
                        </td>

                        <td className="p-4 align-top space-y-1">
                          {rev.title && (
                            <p className="font-semibold text-[#243126]">{rev.title}</p>
                          )}
                          <p className="text-[#66655d] leading-relaxed max-w-xl">
                            {rev.comment}
                          </p>
                        </td>

                        <td className="p-4 pr-5 text-[#807d73] align-top whitespace-nowrap">
                          {rev.created_at}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Card List (No Horizontal Scroll) */}
              <div className="block sm:hidden divide-y divide-[#f3efe6]">
                {group.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#243126]">{rev.reviewer_name}</span>
                      <span className="text-[11px] text-[#807d73]">{rev.created_at}</span>
                    </div>

                    <div className="flex items-center gap-0.5 text-[#285538]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={
                            star <= rev.rating
                              ? "fill-[#285538] stroke-none"
                              : "text-[#ded8ca] stroke-current fill-none"
                          }
                        />
                      ))}
                    </div>

                    <div className="space-y-1 text-xs">
                      {rev.title && (
                        <p className="font-semibold text-[#243126]">{rev.title}</p>
                      )}
                      <p className="text-[#66655d] leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}