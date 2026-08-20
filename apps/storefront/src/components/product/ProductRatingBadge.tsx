'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { StarRating } from '@/components/ui/star-rating';

export function ProductRatingBadge({ productId }: { productId: string }) {
  const [rating, setRating] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchRatingSummary() {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .select('rating')
          .eq('product_id', String(productId));

        if (!error && data) {
          const total = data.length;
          const avg =
            total > 0
              ? Number((data.reduce((sum, r) => sum + Number(r.rating), 0) / total).toFixed(1))
              : 0;
          setRating(avg);
          setCount(total);
        }
      } catch (err) {
        console.error('Error fetching rating summary:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRatingSummary();
  }, [productId]);

  if (loading) {
    return <div className="h-4 w-24 bg-[#EDE6D4] animate-pulse rounded-md" />;
  }

  return <StarRating rating={rating} count={count} size={16} />;
}