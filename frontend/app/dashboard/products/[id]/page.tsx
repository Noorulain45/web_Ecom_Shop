"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  style?: string;
  brand?: string;
  sku?: string;
  stock: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  images: string[];
  sizes: string[];
  colors: string[];
  isNewArrival: boolean;
  isTopSelling: boolean;
  loyaltyOnly: boolean;
  hybrid: boolean;
}

const CATEGORIES = ["T-Shirts", "Jeans", "Shorts", "Shirts", "Hoodies", "Accessories"];
const DRESS_STYLES = ["", "Casual", "Formal", "Party", "Gym"];
const SIZES = ["XS", "Small", "Medium", "Large", "X-Large", "XX-Large"];
const PRESET_COLORS = ["#2c2c2c", "#f5f5f5", "#1a3a5c", "#8b2020", "#4a7a4a", "#c0522a", "#4a6a8a"];

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: CATEGORIES[0],
    style: "",
    brand: "",
    sku: "",
    stock: "",
    price: "",
    originalPrice: "",
    discountPercent: "",
    isNewArrival: false,
    isTopSelling: false,
    loyaltyOnly: false,
    hybrid: false,
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<{ file: File; preview: string }[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data: Product) => {
        setProduct(data);
        setForm({
          name: data.name || "",
          description: data.description || "",
          category: data.category || CATEGORIES[0],
          style: data.style || "",
          brand: data.brand || "",
          sku: data.sku || "",
          stock: String(data.stock ?? ""),
          price: String(data.price ?? ""),
          originalPrice: String(data.originalPrice ?? ""),
          discountPercent: String(data.discountPercent ?? ""),
          isNewArrival: data.isNewArrival || false,
          isTopSelling: data.isTopSelling || false,
          loyaltyOnly: data.loyaltyOnly || false,
          hybrid: data.hybrid || false,
        });
        setSelectedSizes(data.sizes || []);
        setSelectedColors(data.colors || []);
        setExistingImages(data.images || []);
        // Use sizes as tags for display
        setTags(data.sizes || []);
      })
      .catch(() => setError("Failed to load product."))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleColor = (c: string) =>
    setSelectedColors((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPreviews = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeExistingImage = (index: number) =>
    setExistingImages((prev) => prev.filter((_, i) => i !== index));

  const removeNewImage = (index: number) => {
    setNewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const handleUpdate = async () => {
    setError("");
    setSuccess("");
    if (!form.name.trim() || !form.price.trim()) {
      setError("Name and price are required.");
      return;
    }
    setSaving(true);

    let uploadedUrls: string[] = [];
    try {
      for (const { file } of newImagePreviews) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        uploadedUrls.push(data.secure_url);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          style: form.style || "",
          stock: Number(form.stock) || 0,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
          discountPercent: form.discountPercent ? Number(form.discountPercent) : 0,
          images: [...existingImages, ...uploadedUrls],
          sizes: selectedSizes,
          colors: selectedColors,
          isNewArrival: form.isNewArrival,
          isTopSelling: form.isTopSelling,
          loyaltyOnly: form.loyaltyOnly,
          hybrid: form.hybrid,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setNewImagePreviews([]);
      setExistingImages(data.images || existingImages);
      router.push("/dashboard/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      router.push("/dashboard/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400 text-sm">
        Loading product…
      </div>
    );
  }

  if (!product && !loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400 text-sm">
        Product not found.
      </div>
    );
  }

  const mainImage = existingImages[0] || newImagePreviews[0]?.preview || null;

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Product Details</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Home &gt; All Products &gt; Product Details
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex gap-8">
          {/* Left — form fields */}
          <div className="flex-1 flex flex-col gap-5">

            {/* Product Name */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Product Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Type name here"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                placeholder="Type Description here"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Type Category here"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              />
            </div>

            {/* Dress Style */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Dress Style</label>
              <select
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              >
                {DRESS_STYLES.map((s) => (
                  <option key={s} value={s}>{s === "" ? "— None —" : s}</option>
                ))}
              </select>
            </div>

            {/* Brand Name */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Brand Name</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Type brand name here"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
              />
            </div>

            {/* SKU + Stock */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-800 block mb-1">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="Fox-3083"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-800 block mb-1">Stock Quantity</label>
                <input
                  type="number" min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="1258"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>
            </div>

            {/* Regular Price + Sale Price */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-800 block mb-1">Regular Price</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  placeholder="₹1000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-800 block mb-1">Sale Price</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="₹450"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-semibold text-gray-800 block mb-1">Tag</label>
              <div className="border border-gray-300 rounded-lg px-3 py-2.5 min-h-[72px] flex flex-wrap gap-2 items-start">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 bg-gray-800 text-white text-xs px-3 py-1 rounded-full"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-gray-300 hover:text-white ml-1 leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder={tags.length === 0 ? "Add tag and press Enter" : ""}
                  className="text-xs outline-none flex-1 min-w-[80px] bg-transparent"
                />
              </div>
            </div>

            {/* Flags */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "isNewArrival", label: "New Arrival" },
                { key: "isTopSelling", label: "Top Selling" },
                { key: "loyaltyOnly", label: "Loyalty Only" },
                { key: "hybrid", label: "Hybrid" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="w-4 h-4 accent-[#1a3a5c]"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

          </div>

          {/* Right — image + gallery */}
          <div className="w-72 flex flex-col gap-4 shrink-0">

            {/* Main image preview */}
            <div className="w-full aspect-square rounded-xl bg-gray-200 overflow-hidden relative">
              {mainImage ? (
                <Image
                  src={mainImage.includes("/upload/") ? mainImage.replace("/upload/", "/upload/w_400,q_auto,f_auto/") : mainImage}
                  alt="Main product"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
            </div>

            {/* Product Gallery */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Product Gallery</p>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#1a3a5c] transition mb-3"
              >
                <svg className="w-8 h-8 text-[#1a3a5c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
                  <path d="M3 15l5-5 4 4 3-3 6 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
                </svg>
                <p className="text-xs text-gray-500 text-center">Drop your images here, or browse</p>
                <p className="text-xs text-gray-400">Jpeg, png are allowed</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              {/* Existing images list */}
              <div className="flex flex-col gap-2">
                {existingImages.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5">
                    <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden relative shrink-0">
                      <Image
                        src={url.includes("/upload/") ? url.replace("/upload/", "/upload/w_80,q_auto,f_auto/") : url}
                        alt={`img-${i}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">Product thumbnail.png</p>
                      <div className="h-1 bg-[#1a3a5c] rounded-full mt-1 w-full" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="w-5 h-5 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center text-xs shrink-0"
                    >
                      ✓
                    </button>
                  </div>
                ))}
                {newImagePreviews.map((img, i) => (
                  <div key={`new-${i}`} className="flex items-center gap-2 bg-blue-50 rounded-lg px-2 py-1.5">
                    <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden relative shrink-0">
                      <Image src={img.preview} alt={`new-${i}`} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">{img.file.name}</p>
                      <div className="h-1 bg-blue-400 rounded-full mt-1 w-3/4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Sizes</p>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.map((s) => (
                  <button
                    key={s} type="button"
                    onClick={() => toggleSize(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                      selectedSizes.includes(s)
                        ? "bg-[#1a3a5c] text-white border-[#1a3a5c]"
                        : "bg-gray-100 text-gray-600 border-transparent hover:border-gray-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Colors</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c} type="button"
                    onClick={() => toggleColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      selectedColors.includes(c) ? "border-black scale-110" : "border-gray-200"
                    }`}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Feedback */}
        {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
        {success && <p className="text-xs text-green-600 mt-4">{success}</p>}

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving || deleting}
            className="bg-gray-900 text-white text-sm font-semibold px-8 py-2.5 rounded-lg hover:bg-gray-700 transition disabled:opacity-60"
          >
            {saving ? "Updating…" : "UPDATE"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="bg-[#1a3a5c] text-white text-sm font-semibold px-8 py-2.5 rounded-lg hover:bg-[#122840] transition disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "DELETE"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/products")}
            disabled={saving || deleting}
            className="border border-gray-300 text-gray-700 text-sm font-semibold px-8 py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
