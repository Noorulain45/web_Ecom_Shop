import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-8 py-4 text-xs text-gray-400 flex gap-2">
        <a href="/store" className="hover:text-black">Home</a>
        <span>/</span>
        <a href="/store/cart" className="hover:text-black">Cart</a>
        <span>/</span>
        <span className="text-black">Checkout</span>
      </div>
      <CheckoutClient />
      <Footer />
    </main>
  );
}
