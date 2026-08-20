"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadActiveCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (!error && data) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Error loading categories in footer:", err);
      }
    }

    loadActiveCategories();
  }, []);

  return (
    <footer className="bg-[#f3efe6] border-t border-border/50 text-foreground pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/brand/divine-you-logo.png"
                alt="Divine You"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
              <div>
                <p className="font-serif text-[18px] font-medium tracking-[0.14em] text-foreground">
                  DIVINE YOU
                </p>
                <p className="text-[8px] font-medium tracking-[0.35em] text-muted-foreground">
                  AYURVEDA
                </p>
              </div>
            </Link>

            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-sm">
              Divine You makes small-batch Ayurvedic powders and botanical care for calm, consistent daily routines — clean ingredients, honest labels, nothing extra.
            </p>

            <div className="space-y-2.5 text-[13px] text-muted-foreground pt-1">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="shrink-0 text-foreground/70" />
                <span>New Delhi, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-foreground/70" />
                <a href="mailto:support@divineyou.in" className="hover:text-forest transition-colors">
                  support@divineyou.in
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-foreground/70" />
                <a href="tel:+919793844400" className="hover:text-forest transition-colors">
                  +91 97 9384 4400
                </a>
              </div>
            </div>
          </div>

          {/* Dynamic Shop Categories */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif text-xs font-semibold tracking-[0.2em] uppercase text-foreground/80">
              SHOP
            </h4>
            <ul className="space-y-2.5 text-[13px] text-muted-foreground">
              <li>
                <Link href="/shop" className="hover:text-forest transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/best-sellers" className="hover:text-forest transition-colors">
                  Best Sellers
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id || cat.slug}>
                  <Link
                    href={`/shop?category=${cat.slug}`}
                    className="hover:text-forest transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif text-xs font-semibold tracking-[0.2em] uppercase text-foreground/80">
              SUPPORT
            </h4>
            <ul className="space-y-2.5 text-[13px] text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-forest transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-forest transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-forest transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-forest transition-colors">
                  Shipping & Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links Only */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-serif text-xs font-semibold tracking-[0.2em] uppercase text-foreground/80">
              STAY IN TOUCH
            </h4>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-foreground hover:border-forest hover:text-forest transition-colors shadow-soft"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-foreground hover:border-forest hover:text-forest transition-colors shadow-soft"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-foreground hover:border-forest hover:text-forest transition-colors shadow-soft"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <p>© 2026 Divine You Ayurveda. All rights reserved.</p>
          <p>Handcrafted in New Delhi, India.</p>
        </div>
      </div>
    </footer>
  );
}