"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  author: string;
  read_time: string;
  published_date: string;
  cover_image: string;
  content: string;
  likes: number;
  status: "Published" | "Draft" | string;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogArticle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    category: "Ayurveda",
    author: "Divine You Editorial",
    published_date: new Date().toISOString().split("T")[0],
    read_time: "4 min read",
    cover_image: "",
    content: "",
    status: "Draft",
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase blogs fetch error:", error);
        alert("Error fetching blogs: " + error.message);
        return;
      }

      if (data) {
        const formatted: BlogArticle[] = data.map((item: any) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          subtitle: item.subtitle || "",
          category: item.category || "Ayurveda",
          author: item.author || "Divine You Editorial",
          read_time: item.read_time || "4 min read",
          published_date: item.created_at
            ? new Date(item.created_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          cover_image: item.cover_image || "",
          content: item.content || "",
          likes: Number(item.likes || 0),
          status: item.status || "Published",
        }));
        setBlogs(formatted);
      }
    } catch (err) {
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateModal() {
    setEditingBlog(null);
    setFormData({
      title: "",
      subtitle: "",
      category: "Ayurveda",
      author: "Divine You Editorial",
      published_date: new Date().toISOString().split("T")[0],
      read_time: "4 min read",
      cover_image: "",
      content: "",
      status: "Draft",
    });
    setIsModalOpen(true);
  }

  function handleOpenEditModal(blog: BlogArticle) {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      subtitle: blog.subtitle,
      category: blog.category,
      author: blog.author,
      published_date: blog.published_date,
      read_time: blog.read_time,
      cover_image: blog.cover_image,
      content: blog.content,
      status: blog.status,
    });
    setIsModalOpen(true);
  }

  async function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (uploadError) {
        console.warn("Storage upload failed, reading locally:", uploadError.message);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, cover_image: reader.result as string }));
          setUploadingImage(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setFormData((prev) => ({ ...prev, cover_image: urlData.publicUrl }));
      }
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleToggleStatus(blog: BlogArticle) {
    const newStatus = blog.status === "Published" ? "Draft" : "Published";

    // Optimistically update UI
    setBlogs((prev) =>
      prev.map((b) => (b.id === blog.id ? { ...b, status: newStatus } : b))
    );

    try {
      const { error } = await supabase
        .from("blogs")
        .update({ status: newStatus })
        .eq("id", blog.id);

      if (error) {
        alert("Database status update failed: " + error.message);
        // Rollback state if DB update failed
        fetchBlogs();
      }
    } catch (err) {
      console.error("Error toggling status:", err);
      fetchBlogs();
    }
  }

  async function handleDeleteBlog(id: string) {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) {
        alert("Delete error: " + error.message);
      } else {
        setBlogs((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Error deleting blog:", err);
    }
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Title and Content are required.");
      return;
    }

    try {
      setSubmitting(true);

      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const payload = {
        title: formData.title,
        subtitle: formData.subtitle,
        slug: editingBlog ? editingBlog.slug : generatedSlug,
        category: formData.category,
        author: formData.author,
        read_time: formData.read_time,
        cover_image: formData.cover_image,
        content: formData.content,
        status: formData.status,
        created_at: new Date(formData.published_date).toISOString(),
      };

      if (editingBlog) {
        const { error } = await supabase
          .from("blogs")
          .update(payload)
          .eq("id", editingBlog.id);

        if (error) {
          alert("Error updating article: " + error.message);
          return;
        }

        setBlogs((prev) =>
          prev.map((b) =>
            b.id === editingBlog.id
              ? { ...b, ...payload, published_date: formData.published_date }
              : b
          )
        );
      } else {
        const { data, error } = await supabase
          .from("blogs")
          .insert([payload])
          .select();

        if (error) {
          alert("Error creating article: " + error.message);
          return;
        }

        if (data && data[0]) {
          setBlogs((prev) => [
            {
              id: data[0].id,
              ...payload,
              likes: 0,
              published_date: formData.published_date,
            },
            ...prev,
          ]);
        }
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Submit blog error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function formatDateShort(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#243126] font-medium tracking-tight">
            Blogs
          </h1>
          <p className="text-xs sm:text-sm text-[#66655d]">
            Published articles appear in the homepage journal carousel.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="bg-[#243126] hover:bg-[#1a231b] text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New article</span>
        </button>
      </div>

      {/* Articles Table Container */}
      <div className="bg-white rounded-2xl border border-[#e8e2d4]/80 overflow-hidden shadow-none">
        {loading ? (
          <div className="p-16 flex justify-center text-[#807d73]">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : blogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#807d73]">
            No blog articles found in database. Click &quot;New article&quot; to write one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#243126]">
              <thead className="bg-[#fbf9f3] text-[#807d73] uppercase tracking-[0.15em] text-[10px] font-semibold border-b border-[#e8e2d4]/70">
                <tr>
                  <th className="p-5 font-semibold w-2/5">ARTICLE</th>
                  <th className="p-5 font-semibold">CATEGORY</th>
                  <th className="p-5 font-semibold">PUBLISHED</th>
                  <th className="p-5 font-semibold">LIKES</th>
                  <th className="p-5 font-semibold">STATUS</th>
                  <th className="p-5 font-semibold text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3efe6]">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-[#fbf9f3]/60 transition-colors">
                    <td className="p-5 space-y-0.5">
                      <p className="font-medium text-[#243126] line-clamp-1">
                        {blog.title}
                      </p>
                      <p className="text-[11px] text-[#807d73]">{blog.author}</p>
                    </td>

                    <td className="p-5 text-[#66655d]">{blog.category}</td>

                    <td className="p-5 text-[#66655d]">
                      {formatDateShort(blog.published_date)}
                    </td>

                    <td className="p-5 font-medium text-[#243126]">{blog.likes}</td>

                    <td className="p-5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wider ${
                          blog.status === "Published"
                            ? "bg-[#dce6d8] text-[#243126]"
                            : "bg-[#f3efe6] text-[#807d73]"
                        }`}
                      >
                        {blog.status}
                      </span>
                    </td>

                    <td className="p-5 text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(blog)}
                        title={blog.status === "Published" ? "Unpublish to Draft" : "Publish"}
                        className="text-[#807d73] hover:text-[#243126] transition cursor-pointer"
                      >
                        {blog.status === "Published" ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(blog)}
                        title="Edit Article"
                        className="text-[#807d73] hover:text-[#243126] transition cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBlog(blog.id)}
                        title="Delete Article"
                        className="text-[#807d73] hover:text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New / Edit Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f3] rounded-3xl border border-[#ded8ca] max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e8e2d4] pb-4 sticky top-0 bg-[#fbf9f3] z-10">
              <h3 className="font-serif text-2xl font-normal text-[#243126]">
                {editingBlog ? "Edit article" : "New article"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#807d73] hover:text-[#243126] transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs text-[#243126]">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-medium text-[#243126]">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Simple Ayurvedic Rituals for Everyday Wellness"
                  className="w-full bg-[#fbf9f3] border border-[#ded8ca] rounded-xl px-3.5 py-2.5 text-xs text-[#243126] outline-none focus:border-[#285538]"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="font-medium text-[#243126]">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Small mindful practices inspired by traditional Ayurvedic principles."
                  className="w-full bg-[#fbf9f3] border border-[#ded8ca] rounded-xl px-3.5 py-2.5 text-xs text-[#243126] outline-none focus:border-[#285538]"
                />
              </div>

              {/* Category & Author */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-[#243126]">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#fbf9f3] border border-[#ded8ca] rounded-xl px-3.5 py-2.5 text-xs text-[#243126] outline-none focus:border-[#285538]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-[#243126]">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-[#fbf9f3] border border-[#ded8ca] rounded-xl px-3.5 py-2.5 text-xs text-[#243126] outline-none focus:border-[#285538]"
                  />
                </div>
              </div>

              {/* Published Date & Reading Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-[#243126]">Published date</label>
                  <input
                    type="date"
                    value={formData.published_date}
                    onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                    className="w-full bg-[#fbf9f3] border border-[#ded8ca] rounded-xl px-3.5 py-2.5 text-xs text-[#243126] outline-none focus:border-[#285538]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-[#243126]">Reading time</label>
                  <input
                    type="text"
                    value={formData.read_time}
                    onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                    className="w-full bg-[#fbf9f3] border border-[#ded8ca] rounded-xl px-3.5 py-2.5 text-xs text-[#243126] outline-none focus:border-[#285538]"
                  />
                </div>
              </div>

              {/* Article Cover Image Section */}
              <div className="space-y-1.5">
                <label className="font-medium text-[#243126]">Article Cover Image</label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#f3efe6] hover:bg-[#eae4d7] border border-[#ded8ca] rounded-xl px-4 py-2.5 text-xs font-medium text-[#243126] flex items-center justify-center gap-2 transition cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 size={15} className="animate-spin text-[#285538]" />
                    ) : (
                      <Upload size={15} className="text-[#285538]" />
                    )}
                    <span>{uploadingImage ? "Uploading..." : "Upload Image File"}</span>
                  </button>

                  <input
                    type="text"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    placeholder="or paste image URL directly"
                    className="flex-1 bg-[#fbf9f3] border border-[#ded8ca] rounded-xl px-3.5 py-2.5 text-xs text-[#243126] outline-none focus:border-[#285538]"
                  />
                </div>

                {formData.cover_image && (
                  <div className="mt-2 relative h-32 w-full rounded-xl border border-[#ded8ca] overflow-hidden bg-white flex items-center justify-center">
                    {/* eslint-disable-next-next/no-img-element */}
                    <img
                      src={formData.cover_image}
                      alt="Cover Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image: "" })}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black transition cursor-pointer"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="font-medium text-[#243126]">Content</label>
                <textarea
                  rows={6}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Separate paragraphs with a blank line."
                  className="w-full bg-[#fbf9f3] border border-[#ded8ca] rounded-xl p-3.5 text-xs text-[#243126] outline-none focus:border-[#285538] leading-relaxed resize-y"
                />
              </div>

              {/* Status Dropdown */}
              <div className="space-y-1.5">
                <label className="font-medium text-[#243126]">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#fbf9f3] border border-[#ded8ca] rounded-xl px-3.5 py-2.5 text-xs text-[#243126] outline-none focus:border-[#285538] cursor-pointer"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#e8e2d4]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#ded8ca] text-xs font-medium text-[#243126] hover:bg-[#f3efe6] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#243126] text-white text-xs font-medium hover:bg-[#1a231b] transition cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingBlog
                    ? "Save changes"
                    : "Create article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}