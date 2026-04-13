import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import ProductDetailClient from "./ProductDetailClient";
import Navbar from "../../components/Navbar";
import Newsletter from "../../components/Newsletter";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

async function getProduct(id: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getRelated(category: string, excludeId: string) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/products?category=${encodeURIComponent(category)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const products = await res.json();
    return products.filter((p: any) => p._id !== excludeId).slice(0, 4);
  } catch {
    return [];
  }
}

async function getUserPoints(cookieHeader: string): Promise<number> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.loyaltyPoints ?? 0;
  } catch {
    return 0;
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, session] = await Promise.all([getProduct(id), getSession()]);
  if (!product) notFound();

  const related = await getRelated(product.category, id);

  let userPoints = 0;
  if (session?.userId) {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    userPoints = await getUserPoints(cookieHeader);
  }

  return (
    <main className="min-h-screen bg-white font-sans">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 text-xs text-gray-400 flex gap-2">
        <a href="/store" className="hover:text-black">Home</a>
        <span>/</span>
        <a href="/store" className="hover:text-black">Shop</a>
        <span>/</span>
        <span className="text-black">{product.name}</span>
      </div>

      <ProductDetailClient
        product={{
          id: product._id.toString(),
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          discount: product.discountPercent,
          description: product.description,
          images: product.images,
          colors: product.colors,
          sizes: product.sizes,
          colorImages: product.colorImages
            ? Object.fromEntries(
                Object.entries(
                  product.colorImages instanceof Map
                    ? Object.fromEntries(product.colorImages)
                    : (product.colorImages as Record<string, string[]>)
                )
              )
            : {},
          loyaltyOnly: !!product.loyaltyOnly,
          rating: product.rating ?? 0,
          reviews: product.reviews ?? 0,
        }}
        currentUserId={session?.userId}
        currentUserName={session?.name}
        userPoints={userPoints}
      />

      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12">
          <h2 className="text-2xl md:text-3xl font-black uppercase text-center mb-6 md:mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p: any) => (
              <ProductCard
                key={p._id.toString()}
                id={p._id.toString()}
                name={p.name}
                rating={p.rating ?? 0}
                reviews={p.reviews ?? 0}
                price={p.price}
                originalPrice={p.originalPrice}
                discount={p.discountPercent}
                image={p.images?.[0]}
              />
            ))}
          </div>
        </section>
      )}

      <Newsletter />
      <Footer />
    </main>
  );
}
