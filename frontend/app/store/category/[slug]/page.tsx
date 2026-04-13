import Navbar from "../../components/Navbar";
import Newsletter from "../../components/Newsletter";
import Footer from "../../components/Footer";
import CategoryClient from "./CategoryClient";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <main className="min-h-screen bg-white font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-8 py-4 text-xs text-gray-400 flex gap-2">
        <a href="/store" className="hover:text-black">Home</a>
        <span>/</span>
        <span className="text-black">{label}</span>
      </div>
      <CategoryClient label={label} />
      <Newsletter />
      <Footer />
    </main>
  );
}
