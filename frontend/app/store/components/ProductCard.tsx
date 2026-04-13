import Link from "next/link";
import Image from "next/image";

export interface ProductCardProps {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  loyaltyOnly?: boolean;
  userPoints?: number;
}

export function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.95 2.878c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.065 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.284-3.957z" />
        </svg>
      ))}
    </div>
  );
}

function buildCloudinaryUrl(url: string, width: number) {
  // Insert transformation into Cloudinary URL
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}

export default function ProductCard({ id, name, rating, reviews, price, originalPrice, discount, image, loyaltyOnly, userPoints }: ProductCardProps) {
  const imgSrc = image ? buildCloudinaryUrl(image, 400) : null;
  const isLocked = loyaltyOnly && (userPoints ?? 0) < 500;

  return (
    <Link href={`/store/product/${id}`} className="flex flex-col gap-2 group cursor-pointer">
      <div className="bg-[#f0eeed] rounded-xl aspect-square flex items-center justify-center overflow-hidden group-hover:opacity-90 transition relative">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={name}
            fill
            className={`object-cover ${isLocked ? "opacity-40" : ""}`}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <span className="text-gray-400 text-xs">No Image</span>
        )}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl">🔒</span>
            <span className="text-xs font-semibold text-gray-700 bg-white/80 px-2 py-0.5 rounded-full">
              Loyalty Only
            </span>
          </div>
        )}
      </div>
      <p className="font-semibold text-sm">{name}</p>
      <div className="flex items-center gap-1">
        <Stars rating={rating} />
        <span className="text-xs text-gray-500">{rating}/{reviews}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm">${price}</span>
        {originalPrice && (
          <span className="text-gray-400 line-through text-sm">${originalPrice}</span>
        )}
        {discount && (
          <span className="bg-red-100 text-red-500 text-xs px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>
    </Link>
  );
}
