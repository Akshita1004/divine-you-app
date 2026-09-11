import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f7f3eb]">
      {/* Desktop Background Image (Untouched) */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[60%]">
        <Image
          src="/images/products/hero-product.png"
          alt="Divine You herbal wellness product"
          fill
          priority
          className="object-contain object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f7f3eb] via-[#f7f3eb]/65 via-15% to-transparent to-48%" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-6 lg:py-28 lg:px-6 lg:min-h-[680px] flex flex-col lg:flex-row lg:items-center">
        
        {/* Text Content */}
        <div className="max-w-2xl w-full pt-2 lg:pt-0">
          <p className="mb-3 lg:mb-7 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#66655d]">
            Pure Essence
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[64px] font-normal leading-[0.98] tracking-[-0.025em] text-[#302d28]">
            Pure essence for
            <span className="block text-[#292b25]">
              everyday wellness
            </span>
          </h1>

          <p className="mt-4 lg:mt-8 max-w-[460px] text-[15px] lg:text-[15px] leading-6 lg:leading-7 tracking-[0.045em] text-[#66655d]">
            Small-batch Ayurvedic powders and botanical care, made with clean
            ingredients and honest labels — for routines you can keep, day
            after day.
          </p>

          <div className="mt-5 lg:mt-10 flex flex-wrap items-center gap-5 lg:gap-7">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-[#285538] px-6 py-2.5 lg:px-7 lg:py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1f462c]"
            >
              Explore Products
            </Link>

            <Link
              href="/about"
              className="inline-flex items-center gap-3 text-sm font-medium tracking-[0.08em] text-[#43483f] transition hover:text-[#285538]"
            >
              About Us
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Mobile Product Image with full width and proper height */}
        <div 
          className="block lg:hidden relative w-[calc(100%+3rem)] -mx-6 h-[380px] sm:h-[440px] mt-6"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 35%, black 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 35%, black 100%)',
          }}
        >
          <Image
            src="/images/products/hero-product.png"
            alt="Divine You herbal wellness product"
            fill
            priority
            className="object-contain object-top"
          />
        </div>

      </div>
    </section>
  );
}