"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useSearch } from "@/context/search-context";

export function SearchModal() {
  const { isSearchOpen, closeSearch } = useSearch();
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSearch();
      }
    };

    if (isSearchOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  if (!isSearchOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    closeSearch();
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeSearch}
      />

      {/* Modal Card Matching Screenshot */}
      <div className="relative z-10 w-full max-w-lg rounded-[24px] border border-[#e8e2d4] bg-[#fbf9f3] p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeSearch}
          aria-label="Close search"
          className="absolute top-6 right-6 text-[#6a6861] hover:text-[#243126] transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#243126]">
          Search the collection
        </h2>

        {/* Form */}
        <form onSubmit={handleSearch} className="mt-5 flex items-center gap-2.5">
          <input
            type="text"
            autoFocus
            placeholder="Try moringa, aloe, shilajit..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-xl border border-[#a39f93] bg-[#f2eee5]/40 px-4 py-3 text-xs sm:text-sm text-[#243126] placeholder:text-[#7a776e] focus:border-[#285538] focus:bg-white outline-none transition"
          />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-[#285538] px-5 py-3 text-xs sm:text-sm font-medium text-white hover:bg-[#1f462c] transition cursor-pointer shrink-0"
          >
            <Search size={16} strokeWidth={2} />
            <span>Search</span>
          </button>
        </form>

        {/* ESC Key Hint */}
        <p className="mt-4 text-xs text-[#77756c]">
          Press{" "}
          <kbd className="rounded border border-[#ded8ca] bg-[#f3efe6] px-1.5 py-0.5 text-[10px] font-mono text-[#243126]">
            ESC
          </kbd>{" "}
          to close.
        </p>
      </div>
    </div>
  );
}