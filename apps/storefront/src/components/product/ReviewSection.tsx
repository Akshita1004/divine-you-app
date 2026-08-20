'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Star,
  ThumbsUp,
  Plus,
  Check,
  ChevronDown,
  Trash2,
  Upload,
  X,
  Loader2,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { StarRating } from '@/components/ui/star-rating';

interface Review {
  id: string;
  author: string;
  avatarInitials: string;
  isVerified: boolean;
  rating: number;
  date: string;
  packInfo?: string;
  title: string;
  comment: string;
  helpfulCount: number;
  isOwn?: boolean;
  imageUrl?: string;
  userId: string;
}

export default function ReviewSection({ productId }: { productId?: string }) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [helpfulClicks, setHelpfulClicks] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(4);
  const [sortBy, setSortBy] = useState('Most Recent');

  // Form state
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Helper Function: Recalculate and update `rating` & `reviews_count` in 'products' table
  const syncProductRating = async (pId: string) => {
    try {
      const { data: allRevData } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', String(pId));

      const total = allRevData?.length || 0;
      let newAvg = 0;

      if (total > 0) {
        const sum = allRevData!.reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
        newAvg = Number((sum / total).toFixed(1));
      }

      await supabase
        .from('products')
        .update({
          rating: newAvg,
          reviews_count: total,
        })
        .eq('id', pId);
    } catch (err) {
      console.error('Error syncing product rating:', err);
    }
  };

  // Fetch dynamic reviews from Supabase DB
  const fetchReviews = async () => {
    if (!productId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // 1. Fetch reviews for current product
      const { data: reviewsData, error: reviewsErr } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', String(productId))
        .order('created_at', { ascending: false });

      if (reviewsErr) {
        console.warn('Product reviews query warning:', reviewsErr.message);
        setReviews([]);
        setLoading(false);
        return;
      }

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      // 2. Fetch helpful likes
      const reviewIds = reviewsData.map((r) => r.id);
      const { data: likesData } = await supabase
        .from('review_likes')
        .select('*')
        .in('review_id', reviewIds);

      // 3. Map into UI state
      const initialHelpfulMap: Record<string, boolean> = {};
      const formattedReviews: Review[] = reviewsData.map((rev) => {
        const revLikes = likesData?.filter((l) => l.review_id === rev.id) || [];
        const userHasLiked = user ? revLikes.some((l) => l.user_id === user.id) : false;

        if (userHasLiked) {
          initialHelpfulMap[rev.id] = true;
        }

        const authorName = rev.user_name || 'Verified Buyer';
        const initials = authorName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        const reviewDate = rev.created_at
          ? new Date(rev.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Recently';

        return {
          id: String(rev.id),
          author: authorName,
          avatarInitials: initials || 'VB',
          isVerified: true,
          rating: Number(rev.rating),
          date: reviewDate,
          packInfo: 'Standard pack',
          title: rev.title || '',
          comment: rev.comment || '',
          helpfulCount: revLikes.length,
          isOwn: user ? rev.user_id === user.id : false,
          imageUrl: rev.image_url || undefined,
          userId: rev.user_id,
        };
      });

      setHelpfulClicks(initialHelpfulMap);
      setReviews(formattedReviews);
    } catch (err: any) {
      console.error('Error fetching dynamic reviews:', err?.message || err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, user]);

  // Handle Photo File Select
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Toggle Helpful Button (Db Sync)
  const handleHelpful = async (id: string) => {
    if (!isLoggedIn || !user) {
      router.push('/login');
      return;
    }

    const isAlreadyHelpful = helpfulClicks[id];

    // Optimistic UI Update
    setReviews((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            helpfulCount: isAlreadyHelpful
              ? Math.max(0, item.helpfulCount - 1)
              : item.helpfulCount + 1,
          };
        }
        return item;
      })
    );

    setHelpfulClicks((prev) => ({
      ...prev,
      [id]: !isAlreadyHelpful,
    }));

    try {
      if (isAlreadyHelpful) {
        await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', id)
          .eq('user_id', user.id);
      } else {
        await supabase.from('review_likes').insert([
          {
            review_id: id,
            user_id: user.id,
          },
        ]);
      }
    } catch (err) {
      console.error('Error toggling helpful status:', err);
      fetchReviews();
    }
  };

  // Delete review and sync database product ratings
  const handleDeleteReview = async (id: string) => {
    if (!user || !productId) return;
    if (window.confirm('Are you sure you want to delete your review?')) {
      try {
        const { error } = await supabase
          .from('product_reviews')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (!error) {
          setReviews((prev) => prev.filter((item) => item.id !== id));
          await syncProductRating(productId);
        } else {
          alert('Failed to delete review');
        }
      } catch (err) {
        console.error('Error deleting review:', err);
      }
    }
  };

  // Add new review to Supabase DB & update product rating in products table
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !user) {
      router.push('/login');
      return;
    }

    if (!formComment.trim() || !formTitle.trim()) return;
    setSubmitting(true);

    try {
      let uploadedImageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `reviews/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('review-images')
          .upload(filePath, imageFile);

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('review-images')
            .getPublicUrl(filePath);

          uploadedImageUrl = publicUrlData.publicUrl;
        }
      }

      const payload = {
        product_id: String(productId || 'default'),
        user_id: user.id,
        user_name: user.name || user.email || 'Verified Buyer',
        rating: formRating,
        title: formTitle.trim(),
        comment: formComment.trim(),
        image_url: uploadedImageUrl || null,
      };

      const { error: insertErr } = await supabase.from('product_reviews').insert([payload]);

      if (insertErr) throw insertErr;

      // Sync Product Table with recalculated average
      if (productId) {
        await syncProductRating(productId);
      }

      setShowWriteModal(false);
      setFormTitle('');
      setFormComment('');
      setFormRating(5);
      setImageFile(null);
      setImagePreview(null);

      await fetchReviews();
    } catch (err) {
      console.error('Error posting review:', err);
      alert('Failed to post review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sorting
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'Highest Rating') return b.rating - a.rating;
    if (sortBy === 'Lowest Rating') return a.rating - b.rating;
    return 0; // Most Recent
  });

  // Dynamic Rating calculations (Returns 0 if no reviews exist)
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, percentage };
  });

  return (
    <section className="w-full bg-[#FDFBF7] text-[#2C2A29] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#7D7871] font-medium">
              REVIEWS
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1C1A19] mt-1">
              Customer Reviews
            </h2>
          </div>

          {isLoggedIn ? (
            <button
              onClick={() => setShowWriteModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#1D3B28] hover:bg-[#152B1D] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Write a Review
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="inline-flex items-center justify-center gap-2 bg-[#F4F0E8] hover:bg-[#EAE4D8] border border-[#E0D8CB] text-[#2C2A29] px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm self-start sm:self-auto cursor-pointer"
            >
              <Lock className="w-4 h-4" /> Sign in to Review
            </button>
          )}
        </div>

        {/* Rating Breakdown Banner Card */}
        <div className="bg-[#F4F0E8] rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-10 border border-[#EBE5DA]">
          <div className="md:col-span-5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[#E2DAD0] pb-6 md:pb-0 md:pr-8">
            <div className="text-5xl font-serif text-[#1C1A19] mb-2 tracking-tight">
              {avgRating.toFixed(1)}
            </div>

            <div className="mb-3">
              <StarRating rating={avgRating} size={20} />
            </div>

            <p className="text-xs text-[#6E6A66] mb-4">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>

            <div className="space-y-1.5 text-xs text-[#4A4744]">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full border border-[#2C2A29] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-[#2C2A29]" />
                </div>
                <span>{totalReviews} verified purchases</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-2.5">
            {ratingDistribution.map((item) => (
              <div
                key={item.stars}
                className="flex items-center gap-3 text-xs text-[#524E4A]"
              >
                <span className="w-10 text-right font-medium">{item.stars} star</span>
                <div className="flex-1 bg-[#E4DDD3] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1D3B28] h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="w-4 text-left text-[#7D7871]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sorting & Counter Bar */}
        <div className="flex items-center justify-between mb-6 text-sm text-[#524E4A]">
          <span>{totalReviews} reviews</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7D7871]">Sort by</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-[#E2DAD0] rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-[#2C2A29] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1D3B28]"
              >
                <option>Most Recent</option>
                <option>Highest Rating</option>
                <option>Lowest Rating</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#7D7871] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#7D7871]">
            <Loader2 className="w-6 h-6 animate-spin text-[#1D3B28] mr-2" />
            <span className="text-xs sm:text-sm">Loading verified reviews...</span>
          </div>
        ) : sortedReviews.length === 0 ? (
          <div className="bg-[#F9F6F0] rounded-2xl p-10 border border-[#ECE6DC] text-center space-y-3">
            <h3 className="font-serif text-2xl text-[#1C1A19]">No reviews yet</h3>
            <p className="text-xs sm:text-sm text-[#6E6A66] max-w-md mx-auto">
              Be the first to share your experience with this product.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReviews.slice(0, visibleCount).map((review) => (
              <div
                key={review.id}
                className="bg-[#F9F6F0] rounded-2xl p-6 border border-[#ECE6DC] transition-all hover:border-[#E0D8CB] relative"
              >
                {/* Reviewer Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EFE9DF] text-[#635E58] flex items-center justify-center font-medium text-xs border border-[#E2DAD0]">
                      {review.avatarInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-[#1C1A19]">
                          {review.author}
                        </h4>
                        {review.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-[#EFE9DF] text-[#4A4744] px-2 py-0.5 rounded-md border border-[#E0D8CB]">
                            <Check className="w-3 h-3 text-[#1D3B28]" />
                            Verified Purchase
                          </span>
                        )}
                        {review.isOwn && (
                          <span className="text-[10px] bg-[#1D3B28] text-white px-2 py-0.5 rounded-md font-medium">
                            You
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-[#7D7871]">
                        <StarRating rating={review.rating} size={14} />
                        <span>{review.date}</span>
                        {review.packInfo && <span>· {review.packInfo}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  {review.isOwn && (
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-[#984242] hover:text-[#702525] hover:bg-[#F2E8E8] p-2 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-medium"
                      title="Delete your review"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>

                {/* Review Body */}
                <h5 className="font-serif text-lg text-[#1C1A19] font-medium mb-2">
                  {review.title}
                </h5>
                <p className="text-xs sm:text-sm text-[#4A4744] leading-relaxed mb-4 whitespace-pre-line">
                  {review.comment}
                </p>

                {/* Image Attachment */}
                {review.imageUrl && (
                  <div className="mb-4">
                    <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-[#E0D8CB]">
                      <Image
                        src={review.imageUrl}
                        alt="Customer photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Helpful Button */}
                <button
                  onClick={() => handleHelpful(review.id)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    helpfulClicks[review.id]
                      ? 'bg-[#1D3B28] text-white border-[#1D3B28]'
                      : 'bg-white/80 border-[#E0D8CB] text-[#524E4A] hover:bg-white'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Helpful ({review.helpfulCount})</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < sortedReviews.length && (
          <div className="text-center mt-8">
            <button
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="bg-[#F4F0E8] hover:bg-[#EAE4D8] border border-[#E0D8CB] text-[#2C2A29] text-xs font-semibold px-6 py-2.5 rounded-lg transition-all cursor-pointer"
            >
              Load More Reviews ({sortedReviews.length - visibleCount})
            </button>
          </div>
        )}

        {/* Modal for Write a Review */}
        {showWriteModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#FDFBF7] border border-[#E0D8CB] rounded-2xl max-w-lg w-full p-6 shadow-xl relative text-[#2C2A29]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-2xl text-[#1C1A19]">Write a Review</h3>
                <button
                  type="button"
                  onClick={() => setShowWriteModal(false)}
                  className="p-1 text-[#7D7871] hover:text-[#1C1A19]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#524E4A] mb-1">
                    Logged in as
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.name || user?.email || 'Verified Buyer'}
                    className="w-full bg-[#F4F0E8] border border-[#E0D8CB] rounded-lg p-2.5 text-sm text-[#7D7871] outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#524E4A] mb-1">
                    Rating
                  </label>
                  <div className="flex items-center gap-1 text-[#C69B56]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setFormRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            (hoverRating || formRating) >= star
                              ? 'fill-[#C69B56] stroke-none'
                              : 'stroke-[#C69B56] fill-none'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#524E4A] mb-1">
                    Review Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Beautifully packaged, honest product"
                    className="w-full bg-white border border-[#E0D8CB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1D3B28]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#524E4A] mb-1">
                    Review Comment
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Write your honest opinion..."
                    className="w-full bg-white border border-[#E0D8CB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1D3B28] resize-none"
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-medium text-[#524E4A] mb-1">
                    Add Photo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 bg-white border border-[#E0D8CB] px-3.5 py-2 rounded-lg text-xs font-medium text-[#2C2A29] hover:bg-[#F4F0E8] transition cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>

                    {imagePreview && (
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-[#E0D8CB]">
                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWriteModal(false)}
                    className="px-4 py-2 border border-[#E0D8CB] text-xs font-medium rounded-lg text-[#524E4A] hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#1D3B28] text-white text-xs font-medium rounded-lg hover:bg-[#152B1D] cursor-pointer disabled:opacity-60 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submitting ? 'Posting...' : 'Submit Review'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}