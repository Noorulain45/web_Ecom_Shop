import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import ProductDetailClient from "./ProductDetailClient";
import Navbar from "../../components/Navbar";
import Newsletter from "../../components/Newsletter";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { getSession } from "@/lib/auth";

async function getProduct(id: string) {
  await connectDB();
  try {
    const product = await Product.findById(id).lean();
    return product;
  } catch {
    return null;
  }
}

async function getRelated(category: string, excludeId: string) {
  await connectDB();
  const products = await Product.find({ category, _id: { $ne: excludeId } })
    .limit(4)
    .lean();
  return products;
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, session] = await Promise.all([getProduct(id), getSession()]);
  if (!product) notFound();

  const related = await getRelated(product.category, id);

  // Fetch user's loyalty points if logged in
  let userPoints = 0;
  if (session?.userId) {
    await connectDB();
    const u = await User.findById(session.userId).select("loyaltyPoints").lean();
    userPoints = (u as { loyaltyPoints?: number } | null)?.loyaltyPoints ?? 0;
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
          loyaltyOnly: !!(product as { loyaltyOnly?: boolean }).loyaltyOnly,
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
            {related.map((p) => (
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
