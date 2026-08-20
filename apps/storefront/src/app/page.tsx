"use client";

import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { Footer } from "@/components/layout/footer";

import { HeroSection } from "@/components/home/hero-section";
import { TrustValues } from "@/components/home/trust-values";
import { ShoppingBenefits } from "@/components/home/shopping-benefits";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { CollectionsSection } from "@/components/home/collections-section";
import JournalSection from "@/components/home/JournalSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f3eb] text-[#243126] relative font-sans">
      <TrustBar />
      <Header />
      <CartDrawer />

      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Trust Values */}
      <TrustValues />

      {/* 3. Shopping Benefits */}
      <ShoppingBenefits />

      {/* 4. Shop By Category (Superfoods, Daily Wellness, Skin & Body, Powders) */}
      <ShopByCategory />

      {/* 5. Our Herbal Collection / Products */}
      <CollectionsSection />

      {/* 6. Journal */}
      <JournalSection />

      <Footer />
    </main>
  );
}