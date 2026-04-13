import Navbar from "../components/Navbar";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";
import CartClient from "./CartClient";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-8 py-4 text-xs text-gray-400 flex gap-2">
        <a href="/store" className="hover:text-black">Home</a>
        <span>/</span>
        <span className="text-black">Cart</span>
      </div>
      <CartClient />
      <Newsletter />
      <Footer />
    </main>
  );
}
