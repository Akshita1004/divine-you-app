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
  RotateCcw,
  LogOut,
  Shield,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Blogs", href: "/admin/blogs", icon: FileText },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Reviews", href: "/admin/reviews", icon: MessageSquareQuote },
];

export default function AdminSidebar() {
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

  // Hide sidebar on the login page
  if (pathname === "/admin/login") return null;

  return (
    <>
      {/* Desktop Sidebar (Untouched) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-[#e8e2d4] min-h-screen p-6 flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Admin Brand Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-[#285538] text-white flex items-center justify-center font-serif text-lg font-bold">
              D
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-[#243126] leading-tight">
                Divine You
              </h2>
              <p className="text-[10px] uppercase tracking-wider text-[#807d73] font-semibold flex items-center gap-1">
                <Shield size={10} className="text-[#285538]" /> Admin Portal
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#285538] text-white shadow-xs"
                      : "text-[#66655d] hover:text-[#243126] hover:bg-[#fbf9f3]"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Footer */}
        <div className="pt-6 border-t border-[#f3efe6]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Matching Reference) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f7f3eb] border-t border-[#e8e2d4] px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
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
                  ? "bg-[#285538]/15 text-[#285538] font-semibold"
                  : "text-[#66655d] hover:text-[#243126]"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
              <span className="truncate max-w-[55px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}