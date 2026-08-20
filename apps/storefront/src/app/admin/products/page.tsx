"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Loader2, X, Star, Upload } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Product {
  id: string;
  name: string;
  title?: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  ingredients?: string;
  benefits?: string;
  how_to_use?: string;
  shipping_returns?: string;
  rating?: number;
  reviews_count?: number;
  created_at?: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

const DEFAULT_SHIPPING_TEXT = "Ships within 24 hours. Free delivery on orders above Rs. 999.";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("50");
  const [imageUrl, setImageUrl] = useState("");

  // Specifications
  const [ingredients, setIngredients] = useState("");
  const [benefits, setBenefits] = useState("");
  const [howToUse, setHowToUse] = useState("");
  const [shippingReturns, setShippingReturns] = useState(DEFAULT_SHIPPING_TEXT);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
      ]);

      if (prodRes.data) {
        setProducts(prodRes.data);
      }

      if (catRes.data && catRes.data.length > 0) {
        setCategoriesList(catRes.data);
      } else {
        // Fallback default options
        setCategoriesList([
          { id: "1", name: "Superfoods" },
          { id: "2", name: "Daily Wellness" },
          { id: "3", name: "Skin & Body" },
          { id: "4", name: "Powders" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Image File Upload Handler
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingImage(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("Products")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("Products").getPublicUrl(filePath);
      if (data?.publicUrl) {
        setImageUrl(data.publicUrl);
      }
    } catch (error: any) {
      alert("Error uploading image: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  }

  function handleOpenModal(product?: Product) {
    const defaultCategory = categoriesList[0]?.name || "Superfoods";

    if (product) {
      setEditingProduct(product);
      setName(product.name || "");
      setDescription(product.description || "");
      setCategory(product.category || defaultCategory);
      setPrice(String(product.price || ""));
      setStock(String(product.stock ?? 50));
      setImageUrl(product.image_url || "");
      setIngredients(product.ingredients || "");
      setBenefits(product.benefits || "");
      setHowToUse(product.how_to_use || "");
      setShippingReturns(product.shipping_returns || DEFAULT_SHIPPING_TEXT);
    } else {
      setEditingProduct(null);
      setName("");
      setDescription("");
      setCategory(defaultCategory);
      setPrice("");
      setStock("50");
      setImageUrl("");
      setIngredients("");
      setBenefits("");
      setHowToUse("");
      setShippingReturns(DEFAULT_SHIPPING_TEXT);
    }
    setShowModal(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price) return;

    const payload = {
      name,
      title: name,
      description,
      category: category || categoriesList[0]?.name || "Superfoods",
      price: parseFloat(price),
      stock: parseInt(stock || "0", 10),
      image_url: imageUrl || "/images/products/placeholder.jpg",
      ingredients,
      benefits,
      how_to_use: howToUse,
      shipping_returns: shippingReturns || DEFAULT_SHIPPING_TEXT,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProduct.id);

      if (!error) {
        setShowModal(false);
        fetchData();
      } else {
        alert("Error updating product: " + error.message);
      }
    } else {
      const { error } = await supabase.from("products").insert([
        {
          ...payload,
          rating: 0,
          reviews_count: 0,
        },
      ]);

      if (!error) {
        setShowModal(false);
        fetchData();
      } else {
        alert("Error creating product: " + error.message);
      }
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      fetchData();
    } else {
      alert("Error deleting product: " + error.message);
    }
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#243126] font-medium tracking-tight">
            Products
          </h1>
          <p className="text-xs sm:text-sm text-[#66655d]">
            {products.length} in the catalogue.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#243126] text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1a231b] transition shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Add product</span>
        </button>
      </div>

      {/* Products Table */}
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
                  <th className="p-5 font-semibold">PRODUCT</th>
                  <th className="p-5 font-semibold">CATEGORY</th>
                  <th className="p-5 font-semibold">PRICE</th>
                  <th className="p-5 font-semibold">STOCK</th>
                  <th className="p-5 font-semibold">RATING</th>
                  <th className="p-5 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3efe6]">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-[#fbf9f3]/60 transition-colors"
                  >
                    <td className="p-5 flex items-center gap-4">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#f3efe6] shrink-0 border border-[#e8e2d4]/50">
                        <Image
                          src={product.image_url || "/images/products/placeholder.jpg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-serif text-sm font-medium text-[#243126]">
                          {product.name}
                        </p>
                        {product.description && (
                          <p className="text-xs text-[#807d73] mt-0.5 line-clamp-1 max-w-xs">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-5 text-[#66655d] font-normal">
                      {product.category}
                    </td>

                    <td className="p-5 font-semibold text-[#243126]">
                      ₹{product.price}
                    </td>

                    <td className="p-5 text-[#66655d] font-normal">
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </td>

                    <td className="p-5 text-[#66655d] font-normal">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="fill-[#285538] stroke-none" />
                        <span>{product.rating ?? 0}</span>
                        <span className="text-[#807d73] text-[11px]">
                          ({product.reviews_count ?? 0})
                        </span>
                      </div>
                    </td>

                    <td className="p-5 text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(product)}
                        className="text-[#243126] hover:text-[#285538] transition cursor-pointer"
                        title="Edit"
                      >
                        <Pencil size={16} className="stroke-[1.75]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
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

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ded8ca] max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#f3efe6] pb-4 sticky top-0 bg-white z-10">
              <h3 className="font-serif text-xl font-medium text-[#243126]">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#807d73] hover:text-[#243126]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#66655d] block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Herbal Shilajit Powder"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#66655d] block mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Himalayan-sourced resin powder..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Dynamic Category Dropdown */}
                <div>
                  <label className="text-xs font-semibold text-[#66655d] block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#66655d] block mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="799"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#66655d] block mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  />
                </div>
              </div>

              {/* Product Image Section */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#66655d] block">
                  Product Image
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ded8ca] bg-[#fbf9f3] text-[#243126] text-xs font-medium cursor-pointer hover:bg-[#f3efe6] transition">
                    {uploadingImage ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span>{uploadingImage ? "Uploading..." : "Upload Image File"}</span>
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
                    placeholder="or paste image URL directly"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  />
                </div>

                {imageUrl && (
                  <div className="pt-2 flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#ded8ca] bg-[#f3efe6]">
                      <Image
                        src={imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[11px] text-[#807d73] font-medium">Image Selected</span>
                  </div>
                )}
              </div>

              {/* Product Detailed Specifications */}
              <div className="pt-3 border-t border-[#f3efe6] space-y-3">
                <h4 className="font-serif text-sm font-medium text-[#243126]">
                  Product Details & Usage Instructions
                </h4>

                <div>
                  <label className="text-xs font-semibold text-[#66655d] block mb-1">
                    Ingredients
                  </label>
                  <textarea
                    rows={2}
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="100% Raw Himalayan Shilajit Resin Extract..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#66655d] block mb-1">
                    Benefits
                  </label>
                  <textarea
                    rows={2}
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    placeholder="Enhances stamina, promotes vitality..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#66655d] block mb-1">
                    How To Use
                  </label>
                  <textarea
                    rows={2}
                    value={howToUse}
                    onChange={(e) => setHowToUse(e.target.value)}
                    placeholder="Take a pea-sized amount with warm milk..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#66655d] block mb-1">
                    Shipping & Returns Info
                  </label>
                  <textarea
                    rows={2}
                    value={shippingReturns}
                    onChange={(e) => setShippingReturns(e.target.value)}
                    placeholder="Ships within 24 hours. Free delivery on orders above Rs. 999."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#ded8ca] text-xs outline-none focus:border-[#285538]"
                  />
                </div>
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}