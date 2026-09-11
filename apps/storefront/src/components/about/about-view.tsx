"use client";

import { useState, useRef, useEffect } from "react";

import { TrustBar } from "@/components/layout/trust-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export function AboutView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animFrameId: number;

    const checkTime = () => {
      if (video && video.duration) {
        const trimPoint = video.duration - 1;
        const fadeOutPoint = trimPoint - 0.3;

        if (video.currentTime >= fadeOutPoint && video.currentTime < trimPoint) {
          setIsFading(true);
        }

        if (video.currentTime >= trimPoint) {
          video.currentTime = 0;
          setIsFading(false);
        }
      }
      animFrameId = requestAnimationFrame(checkTime);
    };

    animFrameId = requestAnimationFrame(checkTime);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f3eb] text-[#243126] flex flex-col justify-between">
      <div>
        <TrustBar />
        <Header />

        {/* Hero-style Background Video Section with Hero-matching Layout & CSS Mask for Mobile */}
        <section className="relative isolate overflow-hidden bg-[#f7f3eb] my-6 sm:my-10 lg:my-12 py-8 sm:py-12">
          
          {/* Desktop Background Video Container (Untouched for Web View) */}
          <div className="hidden lg:block absolute inset-y-0 right-0 w-[60%] pointer-events-none">
            <video
              ref={videoRef}
              src="/videos/hero-video.mp4"
              autoPlay
              muted
              playsInline
              className={`h-full w-full object-cover object-center transition-opacity duration-300 ease-in-out ${
                isFading ? "opacity-0" : "opacity-100"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#f7f3eb] via-[#f7f3eb]/65 via-15% to-transparent to-48%" />
          </div>

          {/* Main Container */}
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12 flex flex-col lg:flex-row lg:items-center lg:min-h-[540px]">
            
            {/* Foreground Text Content */}
            <div className="max-w-xl space-y-4 pt-2">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#38553d]">
                OUR STORY
              </p>

              {/* BOLD HEADING */}
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-semibold tracking-[-0.015em] text-[#282723] leading-[1.15]">
                Ayurveda, made for modern routines
              </h1>

              <div className="space-y-4 text-xs sm:text-sm leading-[1.7] text-[#605d54] pt-1">
                <p>
                  At Divine You, we are passionate about creating natural wellness products made with care, purity, and trusted herbal ingredients. Inspired by traditional Ayurvedic knowledge and modern self-care needs, our goal is to help people live healthier lifestyles naturally — with simple, daily essentials like Shilajit Powder, Moringa Leaf Powder, Aloe Vera Gel, and Herbal Powders.
                </p>

                <p>
                  Our vision is to make natural wellness simple, accessible, and trustworthy for everyone. We focus on carefully selected botanical ingredients, quality formulations, and honest labels. We make no medical claims — our products are created to sit alongside a balanced everyday routine.
                </p>
              </div>
            </div>

            {/* Mobile Video Stack with CSS Mask Fade (Identical to Hero Section Pattern) */}
            <div 
              className="block lg:hidden relative w-[calc(100%+3rem)] -mx-6 h-[400px] sm:h-[460px] mt-10"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 35%, black 100%)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 35%, black 100%)',
              }}
            >
              <video
                src="/videos/hero-video.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover object-center"
              />
            </div>

          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}