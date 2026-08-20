import type { Metadata } from "next";
import { Karla, Cormorant_Garamond } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { SearchProvider } from "@/context/search-context";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SearchModal } from "@/components/layout/search-modal";
import "./globals.css";

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Divine You | Ayurveda",
  description: "Natural wellness products made with care, purity, and trusted herbal ingredients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${karla.variable} ${cormorant.variable}`}>
      <body className="antialiased bg-[#fbf9f3] text-[#243126]">
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              {children}
              <CartDrawer />
              <SearchModal />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}