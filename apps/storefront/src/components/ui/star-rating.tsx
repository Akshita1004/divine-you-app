"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  rating?: number; // e.g. 5, 4, 3 or 4.8
  count?: number;  // Optional: Sirf overall product badge ke liye pass karein
  size?: number;   // Icon size
}

export function StarRating({
  rating = 0,
  count,
  size = 16,
}: StarRatingProps) {
  // Agar explicit count = 0 pass hua hai (Matlab product ka 0 review hai)
  const isAggregateZero = count !== undefined && count === 0;

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* 5 Stars Rendering */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = !isAggregateZero && rating >= starValue - 0.25;

          return (
            <Star
              key={index}
              size={size}
              className={`${
                isFilled
                  ? "fill-[#C29232] text-[#C29232]" // Warm Gold Filled
                  : "fill-[#E7DEC8] text-[#E7DEC8]" // Light Gray/Beige Unfilled
              }`}
            />
          );
        })}
      </div>

      {/* Show (count) / 4.8 (42) ONLY on Overall Product Badges (Jab count prop mile) */}
      {count !== undefined && (
        <span className="text-xs sm:text-[13px] font-normal text-[#5F5B52] leading-none">
          {count > 0 && rating > 0 ? (
            <>
              <span className="font-medium text-[#2C2A29] mr-1">{rating.toFixed(1)}</span>
              <span>({count})</span>
            </>
          ) : (
            <span>(0)</span>
          )}
        </span>
      )}
    </div>
  );
}