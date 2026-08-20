"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface BlogDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  author: string;
  read_time: string;
  cover_image: string;
  content: string;
  likes: number;
  created_at: string;
  status: string;
}

export default function SingleBlogPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!slug) return;

    async function fetchBlog() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .eq("slug", slug)
          .single();

        if (!error && data && data.status === "Published") {
          const initialLikes = Number(data.likes || 0);
          setBlog({
            id: data.id,
            slug: data.slug,
            title: data.title,
            subtitle: data.subtitle || "",
            category: (data.category || "INGREDIENTS").toUpperCase(),
            author: data.author || "Divine You Editorial",
            read_time: data.read_time || "6 min read",
            cover_image:
              data.cover_image ||
              "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800",
            content: data.content || "",
            likes: initialLikes,
            created_at: new Date(data.created_at || Date.now()).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            status: data.status,
          });
          setLikesCount(initialLikes);

          // Local storage check for like status
          if (typeof window !== "undefined") {
            const hasLiked = localStorage.getItem(`blog_liked_${data.id}`);
            if (hasLiked === "true") {
              setLiked(true);
            }
          }
        } else {
          setBlog(null);
        }
      } catch (err) {
        console.error("Error loading blog detail:", err);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBlog();
  }, [slug]);

  // Toggle Like / Unlike Function
  async function handleToggleLike() {
    if (!blog) return;

    const isCurrentlyLiked = liked;
    const newLikesCount = isCurrentlyLiked
      ? Math.max(0, likesCount - 1)
      : likesCount + 1;

    setLiked(!isCurrentlyLiked);
    setLikesCount(newLikesCount);

    if (typeof window !== "undefined") {
      if (isCurrentlyLiked) {
        localStorage.removeItem(`blog_liked_${blog.id}`);
      } else {
        localStorage.setItem(`blog_liked_${blog.id}`, "true");
      }
    }

    try {
      await supabase
        .from("blogs")
        .update({ likes: newLikesCount })
        .eq("id", blog.id);
    } catch (err) {
      console.error("Like toggle update failed:", err);
    }
  }

  const renderFormattedParagraphs = (rawContent: string) => {
    const cleanText = rawContent.replace(/\\n/g, "\n");
    const paragraphs = cleanText.split(/\n+/).filter((p) => p.trim().length > 0);

    return paragraphs.map((paragraph, idx) => (
      <p key={idx} className="leading-relaxed font-light text-[#55534a]">
        {paragraph.trim()}
      </p>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf9f3] flex items-center justify-center text-[#807d73]">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#fbf9f3] flex flex-col items-center justify-center text-[#243126] p-6 space-y-4">
        <h2 className="font-serif text-2xl font-normal">Article Not Found</h2>
        <p className="text-xs text-[#66655d]">
          This article is either in draft mode or no longer exists.
        </p>
        <Link
          href="/"
          className="text-xs font-semibold px-4 py-2 bg-[#243126] text-white rounded-xl hover:bg-[#1a231b] transition"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-[#fbf9f3] min-h-screen py-12 sm:py-20 text-[#243126]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#66655d] hover:text-[#243126] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Blogs</span>
        </Link>

        {/* Header Metadata */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#807d73]">
            {blog.category}
          </span>

          <h1 className="font-serif text-3xl sm:text-5xl text-[#243126] font-normal tracking-tight leading-tight">
            {blog.title}
          </h1>

          {blog.subtitle && (
            <p className="text-sm sm:text-base text-[#66655d] font-light">
              {blog.subtitle}
            </p>
          )}

          <div className="pt-2 border-b border-[#e8e2d4]/70 pb-4 text-xs text-[#807d73]">
            By {blog.author} • {blog.created_at} • {blog.read_time}
          </div>
        </div>

        {/* Hero Cover Image */}
        <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden border border-[#e8e2d4]/80 shadow-xs">
          <Image
            src={blog.cover_image}
            alt={blog.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Formatted Content Paragraphs */}
        <div className="space-y-6 pt-4 text-xs sm:text-sm text-[#44423a]">
          {renderFormattedParagraphs(blog.content)}
        </div>

        {/* Dynamic Toggle Like Button Footer */}
        <div className="pt-10 border-t border-[#e8e2d4]/70 flex items-center gap-4">
          <button
            type="button"
            onClick={handleToggleLike}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#ded8ca] bg-white text-[#243126] hover:bg-[#f3efe6] text-xs font-medium transition cursor-pointer shadow-xs"
          >
            <Heart
              size={16}
              className={`transition-colors ${
                liked
                  ? "fill-rose-500 text-rose-500"
                  : "stroke-current fill-none text-[#243126]"
              }`}
            />
            <span>{likesCount}</span>
          </button>
          
          <span className="text-xs text-[#807d73] transition-colors">
            {liked ? "Thanks for the love." : "Enjoyed this story? Leave a like."}
          </span>
        </div>
      </div>
    </article>
  );
}