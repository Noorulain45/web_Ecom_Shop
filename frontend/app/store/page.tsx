import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Brands from "./components/Brands";
import ProductSection from "./components/ProductSection";
import BrowseByStyle from "./components/BrowseByStyle";
import HappyCustomers from "./components/HappyCustomers";
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";

export default function StorePage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <Brands />
      <ProductSection title="NEW ARRIVALS" />
      <ProductSection title="TOP SELLING" />
      <BrowseByStyle />
      <HappyCustomers />
      <Newsletter />
      <Footer />
    </main>
  );
}
