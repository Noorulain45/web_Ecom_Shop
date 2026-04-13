import ProductCard from "./ProductCard";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

async function getProducts(type: "new" | "top") {
  const param = type === "new" ? "isNewArrival=true" : "isTopSelling=true";
  try {
    const res = await fetch(`${BACKEND_URL}/api/products?${param}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const products = await res.json();
    // limit to 4
    return products.slice(0, 4);
  } catch {
    return [];
  }
}

export default async function ProductSection({ title }: { title: string }) {
  const type = title === "NEW ARRIVALS" ? "new" : "top";
  const products = await getProducts(type);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12">
      <h2 className="text-2xl md:text-3xl font-black uppercase text-center mb-6 md:mb-8">{title}</h2>
      {products.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No products yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((p: any) => (
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
      )}
      <div className="flex justify-center mt-6 md:mt-8">
        <button className="border border-gray-300 rounded-full px-8 md:px-10 py-2.5 text-sm font-medium hover:bg-gray-50 transition">
          View All
        </button>
      </div>
    </section>
  );
}
