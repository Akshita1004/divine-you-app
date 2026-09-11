"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, UserRound } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useSearch } from "@/context/search-context";
import { useAuth } from "@/context/auth-context";

export function Header() {
  const { openCart, totalCount } = useCart();
  const { openSearch } = useSearch();
  const { isLoggedIn, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-[#ded8ca]/80 bg-[#fbf9f3]/85 backdrop-blur-md">
      {/* Top Header Row (Original Desktop View Untouched) */}
      <div className="flex h-20 items-center px-8 lg:px-9">
        <div className="-ml-3 flex items-center gap-12">
          <Link href="/" className="flex shrink-0 items-center gap-4">
            <Image
              src="/images/brand/divine-you-logo.png"
              alt="Divine You"
              width={40}
              height={40}
              className="h-8 w-8 object-contain"
              priority
            />
            <div>
              <p className="font-serif text-[19px] font-medium tracking-[0.14em] text-[#35352f]">
                DIVINE YOU
              </p>
              <p className="mt-1 text-[8px] font-medium tracking-[0.35em] text-[#77756c]">
                AYURVEDA
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-12 text-[13px] font-normal tracking-[0.07em] text-[#6a6861] md:flex">
            <Link href="/shop" className="transition hover:text-[#285538]">
              Shop
            </Link>
            <Link href="/best-sellers" className="transition hover:text-[#285538]">
              Best Sellers
            </Link>
            <Link href="/about" className="transition hover:text-[#285538]">
              About Us
            </Link>
            <Link href="/contact" className="transition hover:text-[#285538]">
              Contact
            </Link>
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-7 text-[#353a31]">
          {/* Search Button */}
          <button
            type="button"
            aria-label="Search"
            onClick={openSearch}
            className="transition hover:text-[#285538] cursor-pointer"
          >
            <Search size={18} strokeWidth={1.7} />
          </button>

          {/* Account Link */}
          <Link
            href={isLoggedIn ? "/account" : "/login?mode=signup"}
            aria-label="Account"
            className="transition hover:text-[#285538] cursor-pointer relative flex items-center gap-1.5"
            title={isLoggedIn ? `Logged in as ${user?.name || "User"}` : "Join Divine You"}
          >
            <UserRound size={18} strokeWidth={1.7} />
          </Link>

          {/* Cart Icon with Live Count Badge */}
          <button
            type="button"
            aria-label="Shopping cart"
            onClick={openCart}
            className="transition hover:text-[#285538] cursor-pointer relative"
          >
            <ShoppingBag size={19} strokeWidth={1.7} />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#285538] text-[9px] font-bold text-white">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile-Only Secondary Navigation Row (Exact Font & Style Matching) */}
      <nav className="flex md:hidden items-center justify-center gap-8 py-3 border-t border-[#e8e2d4]/60 text-[13px] font-normal tracking-[0.07em] text-[#6a6861] overflow-x-auto px-4">
        <Link href="/shop" className="transition hover:text-[#285538] whitespace-nowrap">
          Shop
        </Link>
        <Link href="/best-sellers" className="transition hover:text-[#285538] whitespace-nowrap">
          Best Sellers
        </Link>
        <Link href="/about" className="transition hover:text-[#285538] whitespace-nowrap">
          About Us
        </Link>
        <Link href="/contact" className="transition hover:text-[#285538] whitespace-nowrap">
          Contact
        </Link>
      </nav>
    </header>
  );
}