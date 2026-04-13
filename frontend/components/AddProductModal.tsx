"use client";
import { useState, useRef } from "react";
import Image from "next/image";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = ["T-Shirts", "Jeans", "Shorts", "Shirts", "Hoodies", "Accessories"];
const DRESS_STYLES = ["", "Casual", "Formal", "Party", "Gym"];
const SIZES = ["XS", "Small", "Medium", "Large", "X-Large", "XX-Large"];
const PRESET_COLORS = ["#2c2c2c", "#f5f5f5", "#1a3a5c", "#8b2020", "#4a7a4a", "#c0522a", "#4a6a8a"];

type ColorImages = Record<string, { file: File; preview: string }[]>;

export default function AddProductModal({ onClose, onSuccess }: Props) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [form, setForm] = useState({
    name: "",
    category: CATEGORIES[0],
    style: "",
    price: "",
    originalPrice: "",
    discountPercent: "",
    stock: "",
    description: "",
    isNewArrival: false,
    isTopSelling: false,
    loyaltyOnly: false,
    hybrid: false,
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  // per-color image previews
  const [colorImages, setColorImages] = useState<ColorImages>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleColor = (c: string) => {
    setSelectedColors((prev) => {
      if (prev.includes(c)) {
        // remove color and its images
        setColorImages((ci) => {
          const next = { ...ci };
          delete next[c];
          return next;
        });
        return prev.filter((x) => x !== c);
      }
      return [...prev, c];
    });
  };

  const handleColorFiles = (color: string, files: FileList | null) => {
    if (!files) return;
    const newPreviews = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setColorImages((prev) => ({
      ...prev,
      [color]: [...(prev[color] || []), ...newPreviews],
    }));
  };

  const removeColorImage = (color: string, index: number) => {
    setColorImages((prev) => {
      const updated = [...(prev[color] || [])];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return { ...prev, [color]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.price.trim()) {
      setError("Name and price are required.");
      return;
    }

    if (selectedColors.length === 0) {
      setError("Please select at least one color.");
      return;
    }

    for (const color of selectedColors) {
      const imgs = colorImages[color] || [];
      if (imgs.length < 3) {
        setError(`Please upload at least 3 images for color ${color}.`);
        return;
      }
    }

    setUploading(true);

    // Upload images per color
    const uploadedColorImages: Record<string, string[]> = {};
    const allImageUrls: string[] = [];

    try {
      for (const color of selectedColors) {
        const imgs = colorImages[color] || [];
        const urls: string[] = [];
        for (const { file } of imgs) {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed.");
          urls.push(data.secure_url);
        }
        uploadedColorImages[color] = urls;
        // first image of each color goes into the flat images array (for backwards compat)
        if (urls[0]) allImageUrls.push(urls[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
      setUploading(false);
      return;
    }

    setUploading(false);
    setSaving(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
          discountPercent: form.discountPercent ? Number(form.discountPercent) : 0,
          stock: Number(form.stock) || 0,
          images: allImageUrls,
          sizes: selectedSizes,
          colors: selectedColors,
          colorImages: uploadedColorImages,
          style: form.style || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product.");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const busy = uploading || saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-800">Add New Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Classic White T-Shirt"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Category + Price row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 block mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 block mb-1">Price ($) *</label>
              <input
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Dress Style */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Dress Style</label>
            <select
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              {DRESS_STYLES.map((s) => (
                <option key={s} value={s}>{s === "" ? "— None —" : s}</option>
              ))}
            </select>
          </div>

          {/* Original price + Discount row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 block mb-1">Original Price ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 block mb-1">Discount (%)</label>
              <input
                type="number" min="0" max="100"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 block mb-1">Stock</label>
              <input
                type="number" min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s} type="button"
                  onClick={() => toggleSize(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    selectedSizes.includes(s)
                      ? "bg-black text-white border-black"
                      : "bg-gray-100 text-gray-600 border-transparent hover:border-gray-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colors + per-color image upload */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">
              Colors <span className="text-gray-400 font-normal">(select colors, then upload ≥3 images each)</span>
            </label>
            <div className="flex flex-wrap gap-3 mb-4">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => toggleColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    selectedColors.includes(c) ? "border-black scale-110" : "border-gray-200"
                  }`}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>

            {/* Per-color image sections */}
            {selectedColors.map((color) => {
              const imgs = colorImages[color] || [];
              return (
                <div key={color} className="mb-4 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-5 h-5 rounded-full border border-gray-300 inline-block flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      Images for this color
                      <span className={`ml-2 font-semibold ${imgs.length >= 3 ? "text-green-600" : "text-red-500"}`}>
                        ({imgs.length}/3 min)
                      </span>
                    </span>
                  </div>

                  <div
                    onClick={() => fileInputRefs.current[color]?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-gray-400 transition mb-3"
                  >
                    <p className="text-xs text-gray-400">Click to add images</p>
                  </div>
                  <input
                    ref={(el) => { fileInputRefs.current[color] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(e) => handleColorFiles(color, e.target.files)}
                  />

                  {imgs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {imgs.map((img, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                          <Image src={img.preview} alt={`color-img-${i}`} fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => removeColorImage(color, i)}
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Short product description..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 gap-3">
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
                  className="w-4 h-4 accent-black"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={busy}
              className="flex-1 bg-black text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition disabled:opacity-60"
            >
              {uploading ? "Uploading images…" : saving ? "Saving…" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
