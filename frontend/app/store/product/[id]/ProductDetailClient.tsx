"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Stars } from "../../components/ProductCard";
import ReviewSection from "../../components/ReviewSection";

interface ProductProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  description: string;
  images: string[];
  colors: string[];
  sizes: string[];
  colorImages?: Record<string, string[]>;
  rating: number;
  reviews: number;
  loyaltyOnly?: boolean;
}

function buildCloudinaryUrl(url: string, width: number) {
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}

const tabs = ["Product Details", "Ratings & Reviews", "FAQs"];

export default function ProductDetailClient({
  product,
  currentUserId,
  currentUserName,
  userPoints,
}: {
  product: ProductProps;
  currentUserId?: string;
  currentUserName?: string;
  userPoints?: number;
}) {
  const router = useRouter();

  // Resolve initial color and its images
  const firstColor = product.colors[0] || "";
  const getColorImgs = (color: string): string[] => {
    if (product.colorImages && product.colorImages[color]?.length) {
      return product.colorImages[color];
    }
    // fallback: use flat images array
    return product.images;
  };

  const [selectedColor, setSelectedColor] = useState(firstColor);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("Ratings & Reviews");
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMsg, setCartMsg] = useState("");

  // Active images for the currently selected color
  const activeImages = getColorImgs(selectedColor);
  const isLocked = product.loyaltyOnly && (userPoints ?? 0) < 500;

  function handleColorSelect(color: string) {
    setSelectedColor(color);
    setSelectedThumb(0); // reset to first image of new color
  }

  const handleAddToCart = async () => {
    setAddingToCart(true);
    setCartMsg("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      if (res.status === 401) {
        router.push("/store/login");
        return;
      }
      if (!res.ok) {
        const d = await res.json();
        setCartMsg(d.error || "Failed to add to cart.");
        return;
      }
      setCartMsg("Added to cart!");
      setTimeout(() => setCartMsg(""), 2000);
    } catch {
      setCartMsg("Something went wrong.");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-8">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">

        {/* Thumbnails — vertical strip on the left */}
        <div className="hidden md:flex flex-col gap-3 w-[112px] flex-shrink-0">
          {activeImages.slice(0, 3).map((img, i) => (
            <button
              key={`${selectedColor}-${i}`}
              onClick={() => setSelectedThumb(i)}
              className={`w-full aspect-square rounded-xl bg-[#f0eeed] overflow-hidden border-2 transition relative ${
                selectedThumb === i ? "border-black" : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <Image
                src={buildCloudinaryUrl(img, 200)}
                alt={`thumb-${i}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {/* Main image */}
        <div className="flex-shrink-0 md:w-[420px] bg-[#f0eeed] rounded-2xl overflow-hidden relative aspect-square">
          {activeImages.length > 0 ? (
            <Image
              src={buildCloudinaryUrl(activeImages[selectedThumb] || activeImages[0], 800)}
              alt={product.name}
              fill
              className="object-contain p-4"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No Image
            </div>
          )}
        </div>

        {/* Mobile thumbnails — horizontal strip below main image */}
        {activeImages.length > 1 && (
          <div className="flex md:hidden gap-3 overflow-x-auto pb-1">
            {activeImages.slice(0, 3).map((img, i) => (
              <button
                key={`mob-${selectedColor}-${i}`}
                onClick={() => setSelectedThumb(i)}
                className={`w-20 h-20 flex-shrink-0 rounded-xl bg-[#f0eeed] overflow-hidden border-2 transition relative ${
                  selectedThumb === i ? "border-black" : "border-gray-200"
                }`}
              >
                <Image src={buildCloudinaryUrl(img, 200)} alt={`thumb-${i}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-3xl font-black uppercase">{product.name}</h1>

          <div className="flex items-center gap-2">
            <Stars rating={product.rating} />
            <span className="text-sm text-gray-500">{product.rating}/5</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">${product.price}</span>
            {product.originalPrice && (
              <span className="text-gray-400 line-through text-xl">${product.originalPrice}</span>
            )}
            {product.discount && (
              <span className="bg-red-100 text-red-500 text-sm px-3 py-1 rounded-full">
                -{product.discount}%
              </span>
            )}
          </div>

          <p className="text-gray-500 text-sm leading-relaxed border-b border-gray-200 pb-4">
            {product.description}
          </p>

          {/* Color picker */}
          {product.colors.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Select Colors</p>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    style={{ backgroundColor: color }}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      selectedColor === color ? "border-black scale-110" : "border-transparent"
                    }`}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size picker */}
          {product.sizes.length > 0 && (
            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-500 mb-2">Choose Size</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-2 rounded-full text-sm font-medium border transition ${
                      selectedSize === size
                        ? "bg-black text-white border-black"
                        : "bg-gray-100 text-gray-700 border-transparent hover:border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          {isLocked ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Loyalty Members Only</p>
                <p className="text-xs text-amber-600">
                  You need 500 pts to unlock this product. You have {userPoints ?? 0} pts — {500 - (userPoints ?? 0)} more to go.
                </p>
              </div>
            </div>
          ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-xl font-bold w-6 h-6 flex items-center justify-center"
              >−</button>
              <span className="text-sm font-semibold w-4 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="text-xl font-bold w-6 h-6 flex items-center justify-center"
              >+</button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="flex-1 bg-black text-white rounded-full py-3 text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-60"
            >
              {addingToCart ? "Adding…" : "Add to Cart"}
            </button>
          </div>
          )}
          {cartMsg && (
            <p className={`text-xs ${cartMsg.includes("Added") ? "text-green-600" : "text-red-500"}`}>
              {cartMsg}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 md:mt-12 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-6 md:gap-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition border-b-2 ${
                activeTab === tab ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Ratings & Reviews" && (
        <ReviewSection
          productId={product.id}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      )}

      {activeTab === "Product Details" && (
        <div className="mt-8 text-gray-600 text-sm leading-relaxed max-w-2xl">
          <p>{product.description}</p>
        </div>
      )}

      {activeTab === "FAQs" && (
        <div className="mt-8 space-y-4 max-w-2xl">
          {[
            { q: "What is the return policy?", a: "We offer a 30-day return policy on all items." },
            { q: "How do I find my size?", a: "Check our size guide on the product page for detailed measurements." },
            { q: "How long does shipping take?", a: "Standard shipping takes 5-7 business days." },
          ].map(({ q, a }) => (
            <div key={q} className="border border-gray-200 rounded-xl p-4">
              <p className="font-semibold text-sm mb-1">{q}</p>
              <p className="text-gray-500 text-sm">{a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
