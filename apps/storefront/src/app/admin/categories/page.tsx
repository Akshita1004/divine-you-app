"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Loader2, X, Upload } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active: boolean;
  productsCount?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState("1");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function fetchCategories() {
    try {
      setLoading(true);

      const [catRes, prodRes] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("display_order", { ascending: true }),
        supabase.from("products").select("category"),
      ]);

      if (catRes.data) {
        const prodData = prodRes.data || [];

        const formattedCategories: Category[] = catRes.data.map((cat: any) => {
          const count = prodData.filter(
            (p: any) =>
              p.category?.toLowerCase() === cat.name?.toLowerCase() ||
              p.category?.toLowerCase() === cat.slug?.toLowerCase()
          ).length;

          return {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || "",
            image_url: cat.image_url || "",
            display_order: cat.display_order ?? 1,
            is_active: cat.is_active ?? true,
            productsCount: count,
          };
        });

        setCategories(formattedCategories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  }

  // Image Upload Handler for Categories Bucket
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingImage(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("Categories")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("Categories").getPublicUrl(filePath);
      if (data?.publicUrl) {
        setImageUrl(data.publicUrl);
      }
    } catch (error: any) {
      alert("Error uploading image: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  }

  function handleOpenModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || "");
      setImageUrl(category.image_url || "");
      setDisplayOrder(String(category.display_order ?? categories.length + 1));
      setIsActive(category.is_active);
    } else {
      setEditingCategory(null);
      setName("");
      setSlug("");
      setDescription("");
      setImageUrl("");
      setDisplayOrder(String(categories.length + 1));
      setIsActive(true);
    }
    setShowModal(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    const finalSlug = slug || generateSlug(name);
    const payload = {
      name,
      slug: finalSlug,
      description,
      image_url: imageUrl,
      display_order: parseInt(displayOrder || "1", 10),
      is_active: isActive,
    };

    if (editingCategory) {
      const { error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", editingCategory.id);

      if (!error) {
        setShowModal(false);
        fetchCategories();
      } else {
        alert("Error updating category: " + error.message);
      }
    } else {
      const { error } = await supabase.from("categories").insert([payload]);

      if (!error) {
        setShowModal(false);
        fetchCategories();
      } else {
        alert("Error creating category: " + error.message);
      }
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      fetchCategories();
    } else {
      alert("Error deleting category: " + error.message);
    }
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#243126] font-medium tracking-tight">
            Categories
          </h1>
          <p className="text-xs sm:text-sm text-[#66655d]">
            Inactive categories stay hidden on the storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#243126] text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1a231b] transition shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Add category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-[#e8e2d4]/80 overflow-hidden shadow-none">
        {loading ? (
          <div className="p-16 flex justify-center text-[#807d73]">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#243126]">
              <thead className="bg-[#fbf9f3] text-[#807d73] uppercase tracking-[0.15em] text-[10px] font-semibold border-b border-[#e8e2d4]/70">
                <tr>
                  <th className="p-5 font-semibold">CATEGORY</th>
                  <th className="p-5 font-semibold">SLUG</th>
                  <th className="p-5 font-semibold">PRODUCTS</th>
                  <th className="p-5 font-semibold">STATUS</th>
                  <th className="p-5 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3efe6]">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-[#fbf9f3]/60 transition-colors"
                  >
                    <td className="p-5 font-serif text-sm font-medium text-[#243126]">
                      {cat.name}
                    </td>

                    <td className="p-5 text-[#66655d] font-normal">
                      {cat.slug}
                    </td>

                    <td className="p-5 text-[#243126] font-medium">
                      {cat.productsCount ?? 0}
                    </td>

                    <td className="p-5 text-[#66655d] font-normal">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold ${
                          cat.is_active
                            ? "bg-[#e2ebd8] text-[#1e3b2b]"
                            : "bg-[#f3efe6] text-[#807d73]"
                        }`}
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="p-5 text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(cat)}
                        className="text-[#243126] hover:text-[#285538] transition cursor-pointer"
                        title="Edit"
                      >
                        <Pencil size={16} className="stroke-[1.75]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-[#243126] hover:text-rose-600 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={16} className="stroke-[1.75]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ded8ca] max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#f3efe6] pb-4 sticky top-0 bg-white z-10">
              <h3 className="font-serif text-xl font-medium text-[#243126]">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#807d73] hover:text-[#243126]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#66655d] block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="e.g. Herbal Powders"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#66655d] block mb-1">
                    Slug (URL Keyword)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. powders"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#66655d] block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    placeholder="1"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#66655d] block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Finely milled classical herbal churnas..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                />
              </div>

              {/* Category Banner Image */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#66655d] block">
                  Category Image
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ded8ca] bg-[#fbf9f3] text-[#243126] text-xs font-medium cursor-pointer hover:bg-[#f3efe6] transition">
                    {uploadingImage ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span>{uploadingImage ? "Uploading..." : "Upload Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="or paste image URL"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  />
                </div>

                {imageUrl && (
                  <div className="pt-2 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#ded8ca] bg-[#f3efe6]">
                      <Image
                        src={imageUrl}
                        alt="Category Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[11px] text-[#807d73] font-medium">Image Loaded</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#66655d] block mb-1">
                  Status
                </label>
                <select
                  value={isActive ? "true" : "false"}
                  onChange={(e) => setIsActive(e.target.value === "true")}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                >
                  <option value="true">Active (Visible on Storefront)</option>
                  <option value="false">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#f3efe6]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#ded8ca] text-xs font-medium text-[#66655d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="px-5 py-2 rounded-xl bg-[#243126] text-white text-xs font-semibold hover:bg-[#1a231b] disabled:opacity-50"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}