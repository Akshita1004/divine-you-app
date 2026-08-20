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
    <div className="min-h-screen bg-[#f3efe6] text-[#243126] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#f9f7f2] border-r border-[#e6e0d2] flex flex-col justify-between shrink-0 p-6">
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

      {/* Main Content */}
      <main className="flex-1 p-8 sm:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}