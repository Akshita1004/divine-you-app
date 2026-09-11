"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  FileText,
  ShoppingBag,
  MessageSquareQuote,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Blogs", href: "/admin/blogs", icon: FileText },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Reviews", href: "/admin/reviews", icon: MessageSquareQuote },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3efe6] text-[#243126] flex flex-col lg:flex-row font-sans">
      {/* Mobile Top Header with Translucent Effect & Logout Button */}
      <header className="lg:hidden flex items-center justify-between bg-[#f9f7f2]/80 backdrop-blur-md border-b border-[#e6e0d2] px-6 py-4 sticky top-0 z-50">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-lg font-medium tracking-wide text-[#243126]">
            Divine You
          </span>
          <span className="text-[8px] font-semibold tracking-[0.25em] text-[#807d73] uppercase">
            ADMIN
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          className="flex items-center gap-1.5 border border-[#ded8ca] bg-white hover:bg-[#f3efe6] text-[#243126] text-xs font-medium py-1.5 px-3 rounded-xl transition cursor-pointer shadow-xs"
        >
          <LogOut size={14} />
          <span>Log out</span>
        </button>
      </header>

      {/* Desktop Sidebar (Untouched for web view) */}
      <aside className="hidden lg:flex w-64 bg-[#f9f7f2] border-r border-[#e6e0d2] flex-col justify-between shrink-0 p-6">
        <div className="space-y-8">
          {/* Brand Logo */}
          <div className="flex items-baseline gap-2 pt-2">
            <span className="font-serif text-xl font-medium tracking-wide text-[#243126]">
              Divine You
            </span>
            <span className="text-[9px] font-semibold tracking-[0.25em] text-[#807d73] uppercase">
              ADMIN
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#dce6d8] text-[#1e3b2b]"
                      : "text-[#66655d] hover:bg-[#eae4d5]/50 hover:text-[#243126]"
                  }`}
                >
                  <Icon size={16} className="shrink-0 stroke-[1.75]" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Info & Logout */}
        <div className="space-y-3 pt-6 border-t border-[#e6e0d2]">
          <p className="text-[11px] text-[#807d73] px-1 font-medium truncate">
            divine05you26@gmail.com
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 border border-[#ded8ca] bg-white hover:bg-[#f3efe6] text-[#243126] text-xs font-medium py-2 px-3 rounded-xl transition cursor-pointer"
          >
            <LogOut size={14} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f9f7f2] border-t border-[#e6e0d2] px-2 py-2 flex items-center justify-around shadow-lg">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? "bg-[#dce6d8] text-[#1e3b2b] font-semibold"
                  : "text-[#66655d] hover:text-[#243126]"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
              <span className="truncate max-w-[55px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-10 pb-24 lg:pb-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}