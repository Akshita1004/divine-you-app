"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  Package,
  FolderTree,
  FileText,
  ShoppingBag,
  MessageSquareQuote,
  TrendingUp,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

interface LowStockItem {
  id: string;
  title: string;
  stock: number;
}

interface HighlightItem {
  id: string;
  title: string;
  description: string;
  link: string;
  type: "order" | "review" | "blog";
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    blogs: 0,
    orders: 0,
    reviews: 0,
    orderValue: 0,
    pendingOrders: 0,
  });

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Track dismissed highlights locally
  const [dismissedHighlights, setDismissedHighlights] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHighlights = localStorage.getItem("dismissed_highlights");
      if (savedHighlights) setDismissedHighlights(JSON.parse(savedHighlights));
    }

    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const [pRes, cRes, bRes, oRes, rRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("blogs").select("*"),
        supabase.from("orders").select("*"),
        supabase.from("reviews").select("*"),
      ]);

      const products = pRes.data || [];
      const categories = cRes.data || [];
      const blogs = bRes.data || [];
      const orders = oRes.data || [];
      
      // Handle Reviews with fallback to 'product_reviews' table
      let reviews = rRes.data || [];
      if (reviews.length === 0 && !rRes.error) {
        const { data: prData } = await supabase.from("product_reviews").select("*");
        if (prData && prData.length > 0) {
          reviews = prData;
        }
      }

      // Calculate Order Values & Pending
      let totalVal = 0;
      let pendingCount = 0;

      orders.forEach((o: any) => {
        const amt = Number(o.total_amount || o.amount || 0);
        totalVal += amt;

        const st = (o.status || "").toUpperCase();
        if (st.includes("CONFIRM") || st.includes("PROCESS") || st === "PENDING") {
          pendingCount++;
        }
      });

      // Filter Low Stock Items (< 30 Threshold)
      const lowStock: LowStockItem[] = products
        .filter((p: any) => Number(p.stock || p.quantity || 0) < 30)
        .map((p: any) => ({
          id: String(p.id),
          title: p.title || p.name || "Ayurvedic Item",
          stock: Number(p.stock || p.quantity || 0),
        }));

      // Generate Quick Action Highlights
      const generatedHighlights: HighlightItem[] = [];

      if (pendingCount > 0) {
        generatedHighlights.push({
          id: "hl-pending-orders",
          title: `${pendingCount} Orders Pending Fulfillment`,
          description: "Customer orders awaiting processing and dispatch.",
          link: "/admin/orders",
          type: "order",
        });
      }

      const draftBlogs = blogs.filter((b: any) => b.status === "Draft");
      if (draftBlogs.length > 0) {
        generatedHighlights.push({
          id: "hl-draft-blogs",
          title: `${draftBlogs.length} Journal Article Drafts`,
          description: "Articles in draft mode. Publish to display on storefront.",
          link: "/admin/blogs",
          type: "blog",
        });
      }

      if (reviews.length > 0) {
        generatedHighlights.push({
          id: "hl-recent-reviews",
          title: `${reviews.length} Customer Reviews`,
          description: "Product reviews submitted by buyers.",
          link: "/admin/reviews",
          type: "review",
        });
      }

      setStats({
        products: products.length,
        categories: categories.length,
        blogs: blogs.length,
        orders: orders.length,
        reviews: reviews.length,
        orderValue: totalVal,
        pendingOrders: pendingCount,
      });

      setLowStockItems(lowStock);
      setHighlights(generatedHighlights);
    } catch (err) {
      console.error("Dashboard data error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleDismissHighlight(id: string) {
    const updated = [...dismissedHighlights, id];
    setDismissedHighlights(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("dismissed_highlights", JSON.stringify(updated));
    }
  }

  const activeHighlights = highlights.filter((item) => !dismissedHighlights.includes(item.id));

  if (loading) {
    return (
      <div className="p-20 flex justify-center text-[#807d73]">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Dashboard Header */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#243126] font-medium tracking-tight">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-[#66655d]">
          Everything here is shared with the website — edits appear instantly.
        </p>
      </div>

      {/* Navigational Stat Cards: grid-cols-2 on mobile, lg:grid-cols-3 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Products Card */}
        <Link
          href="/admin/products"
          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e8e2d4]/70 shadow-none hover:border-[#285538] hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <Package size={22} className="text-[#285538] stroke-[1.75]" />
            <ArrowUpRight size={16} className="text-[#807d73] group-hover:text-[#285538] transition-colors" />
          </div>
          <div>
            <p className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">{stats.products}</p>
            <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-[#807d73] uppercase mt-1">
              PRODUCTS
            </p>
          </div>
        </Link>

        {/* Categories Card */}
        <Link
          href="/admin/categories"
          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e8e2d4]/70 shadow-none hover:border-[#285538] hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <FolderTree size={22} className="text-[#285538] stroke-[1.75]" />
            <ArrowUpRight size={16} className="text-[#807d73] group-hover:text-[#285538] transition-colors" />
          </div>
          <div>
            <p className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">{stats.categories}</p>
            <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-[#807d73] uppercase mt-1">
              CATEGORIES
            </p>
          </div>
        </Link>

        {/* Blogs Card */}
        <Link
          href="/admin/blogs"
          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e8e2d4]/70 shadow-none hover:border-[#285538] hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <FileText size={22} className="text-[#285538] stroke-[1.75]" />
            <ArrowUpRight size={16} className="text-[#807d73] group-hover:text-[#285538] transition-colors" />
          </div>
          <div>
            <p className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">{stats.blogs}</p>
            <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-[#807d73] uppercase mt-1">
              BLOGS
            </p>
          </div>
        </Link>

        {/* Orders Card */}
        <Link
          href="/admin/orders"
          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e8e2d4]/70 shadow-none hover:border-[#285538] hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <ShoppingBag size={22} className="text-[#285538] stroke-[1.75]" />
            <ArrowUpRight size={16} className="text-[#807d73] group-hover:text-[#285538] transition-colors" />
          </div>
          <div>
            <p className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">{stats.orders}</p>
            <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-[#807d73] uppercase mt-1">
              ORDERS ({stats.pendingOrders} PENDING)
            </p>
          </div>
        </Link>

        {/* Reviews Card */}
        <Link
          href="/admin/reviews"
          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e8e2d4]/70 shadow-none hover:border-[#285538] hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <MessageSquareQuote size={22} className="text-[#285538] stroke-[1.75]" />
            <ArrowUpRight size={16} className="text-[#807d73] group-hover:text-[#285538] transition-colors" />
          </div>
          <div>
            <p className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">{stats.reviews}</p>
            <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-[#807d73] uppercase mt-1">
              REVIEWS
            </p>
          </div>
        </Link>

        {/* Order Value Card */}
        <Link
          href="/admin/orders"
          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e8e2d4]/70 shadow-none hover:border-[#285538] hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <TrendingUp size={22} className="text-[#285538] stroke-[1.75]" />
            <ArrowUpRight size={16} className="text-[#807d73] group-hover:text-[#285538] transition-colors" />
          </div>
          <div>
            <p className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">
              ₹{stats.orderValue.toLocaleString("en-IN")}
            </p>
            <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-[#807d73] uppercase mt-1">
              ORDER VALUE
            </p>
          </div>
        </Link>
      </div>

      {/* Main Grid: Quick Highlights + Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Quick Highlights Center */}
        <div className="bg-white rounded-2xl border border-[#e8e2d4]/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#f3efe6] pb-3">
            <div className="flex items-center gap-2 text-[#285538]">
              <Bell size={16} />
              <h2 className="font-serif text-lg font-medium text-[#243126]">
                Quick Highlights
              </h2>
            </div>
            <span className="text-[11px] text-[#807d73]">
              {activeHighlights.length} active
            </span>
          </div>

          <div className="space-y-3">
            {activeHighlights.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#807d73] space-y-1">
                <CheckCircle2 size={20} className="mx-auto text-[#285538] mb-2" />
                <p className="font-medium text-[#243126]">All caught up!</p>
                <p>No active highlights requiring action.</p>
              </div>
            ) : (
              activeHighlights.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-4 rounded-xl border border-[#f3efe6] bg-[#fbf9f3]/70 hover:bg-[#fbf9f3] transition group"
                >
                  <Link href={item.link} className="space-y-1 flex-1 pr-3">
                    <p className="font-medium text-xs text-[#243126] group-hover:text-[#285538] flex items-center gap-1 transition">
                      <span>{item.title}</span>
                      <ArrowUpRight size={13} />
                    </p>
                    <p className="text-[11px] text-[#807d73]">{item.description}</p>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDismissHighlight(item.id)}
                    title="Dismiss highlight"
                    className="text-[#a09d92] hover:text-[#243126] p-1 rounded-lg hover:bg-white transition cursor-pointer shrink-0 mt-0.5"
                  >
                    <Check size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alert Section */}
        <div className="bg-white rounded-2xl border border-[#e8e2d4]/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#f3efe6] pb-3">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={16} />
              <h2 className="font-serif text-lg font-medium text-[#243126]">
                Low Stock Alert (&lt; 30 units)
              </h2>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[#243126] hover:text-[#285538] flex items-center gap-1 transition"
            >
              <span>Manage Products</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#807d73] space-y-1">
                <CheckCircle2 size={20} className="mx-auto text-[#285538] mb-2" />
                <p className="font-medium text-[#243126]">Healthy Inventory</p>
                <p>All products have at least 30 units in stock.</p>
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-[#243126] truncate max-w-[200px]">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-amber-800 font-semibold">
                      Only {item.stock} left in inventory (Needs 30+)
                    </p>
                  </div>

                  <Link
                    href="/admin/products"
                    className="text-xs font-medium text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
                  >
                    <span>Update</span>
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}