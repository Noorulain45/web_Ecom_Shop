"use client";
import { useState, useMemo, useEffect } from "react";
import ProductCard from "../../components/ProductCard";

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  reviews: number;
  images: string[];
  colors: string[];
  sizes: string[];
  category: string;
  stock: number;
}

const COLORS = ["#4caf50", "#f44336", "#ff9800", "#9c27b0", "#00bcd4", "#2196f3", "#e91e63", "#2c2c2c"];
const SIZES = ["XX-Small", "X-Small", "Small", "Medium", "Large", "X-Large", "XX-Large", "3X-Large"];
const DRESS_STYLES = ["Casual", "Formal", "Party", "Gym"];
const SORT_OPTIONS = ["Most Popular", "Latest", "Price: Low to High", "Price: High to Low"];
const PAGE_SIZE = 9;

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="flex items-center justify-between w-full text-sm font-semibold mb-3"
        onClick={() => setOpen(!open)}
      >
        {title}
        <span className="text-gray-400 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && children}
    </div>
  );
}

function FilterPanel({
  priceRange, setPriceRange,
  selectedColors, setSelectedColors,
  selectedSizes, setSelectedSizes,
  selectedStyles, setSelectedStyles,
  setPage, applyFilters,
}: any) {
  const toggleItem = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x: string) => x !== val) : [...arr, val]);
    setPage(1);
  };

  return (
    <div className="border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">Filters</span>
        <button className="text-gray-400 hover:text-black" aria-label="Reset filters" onClick={() => {
          setPriceRange([0, 1000]);
          setSelectedColors([]);
          setSelectedSizes([]);
          setSelectedStyles([]);
          setPage(1);
        }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M4.582 9A8 8 0 0 1 19.418 15M19.418 15A8 8 0 0 1 4.582 9" />
          </svg>
        </button>
      </div>

      <FilterSection title="Shop by">
        <ul className="space-y-2">
          {["T-shirts", "Shorts", "Shirts", "Hoodie", "Jeans"].map((cat) => (
            <li key={cat}>
              <button className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-black">
                {cat} <span className="text-gray-300">›</span>
              </button>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection title="Price">
        <div className="px-1">
          <input
            type="range" min={0} max={500} value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-black"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Colors">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => toggleItem(selectedColors, setSelectedColors, color)}
              style={{ backgroundColor: color }}
              className={`w-7 h-7 rounded-full border-2 transition ${selectedColors.includes(color) ? "border-black scale-110" : "border-transparent"}`}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleItem(selectedSizes, setSelectedSizes, size)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                selectedSizes.includes(size) ? "bg-black text-white border-black" : "bg-gray-100 text-gray-600 border-transparent hover:border-gray-300"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Dress Style">
        <ul className="space-y-2">
          {DRESS_STYLES.map((style) => (
            <li key={style}>
              <button
                onClick={() => toggleItem(selectedStyles, setSelectedStyles, style)}
                className={`flex items-center justify-between w-full text-sm transition ${
                  selectedStyles.includes(style) ? "text-black font-semibold" : "text-gray-600 hover:text-black"
                }`}
              >
                {style} <span className="text-gray-300">›</span>
              </button>
            </li>
          ))}
        </ul>
      </FilterSection>

      <button
        onClick={applyFilters}
        className="w-full bg-black text-white rounded-full py-2.5 text-sm font-semibold mt-4 hover:bg-gray-800 transition"
      >
        Apply Filter
      </button>
    </div>
  );
}

export default function CategoryClient({ label }: { label: string }) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [sort, setSort] = useState("Most Popular");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setLoadingProducts(true);
    fetch(`/api/products?category=${encodeURIComponent(label)}`)
      .then((r) => r.json())
      .then((data: Product[]) => setAllProducts(Array.isArray(data) ? data : []))
      .catch(() => setAllProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [label]);

  const filtered = useMemo(() => {
    let list = [...allProducts].filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (selectedColors.length) list = list.filter((p) => p.colors.some((c) => selectedColors.includes(c)));
    if (selectedSizes.length) list = list.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    if (sort === "Price: Low to High") list.sort((a, b) => a.price - b.price);
    else if (sort === "Price: High to Low") list.sort((a, b) => b.price - a.price);
    else if (sort === "Latest") list.reverse();
    return list;
  }, [priceRange, selectedColors, selectedSizes, sort, allProducts]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filterProps = {
    priceRange, setPriceRange,
    selectedColors, setSelectedColors,
    selectedSizes, setSelectedSizes,
    selectedStyles, setSelectedStyles,
    setPage,
    applyFilters: () => setPage(1),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
      {/* Mobile filter toggle */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <h1 className="text-xl font-black">{label}</h1>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters
        </button>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="md:hidden mb-6">
          <FilterPanel {...filterProps} />
        </div>
      )}

      <div className="flex gap-6 md:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <FilterPanel {...filterProps} />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5 md:mb-6 gap-3 flex-wrap">
            <div className="hidden md:block">
              <h1 className="text-2xl font-black">{label}</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} Products
              </p>
            </div>
            <p className="text-xs text-gray-400 md:hidden">
              {filtered.length} Products
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto">
              Sort by:
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-full px-3 py-1.5 text-sm outline-none font-medium text-black"
              >
                {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {loadingProducts ? (
              <div className="col-span-2 md:col-span-3 py-20 text-center text-gray-400 text-sm">Loading products…</div>
            ) : paginated.length === 0 ? (
              <div className="col-span-2 md:col-span-3 py-20 text-center text-gray-400 text-sm">No products found.</div>
            ) : (
              paginated.map((p) => (
                <ProductCard
                  key={p._id} id={p._id} name={p.name}
                  rating={p.rating ?? 0} reviews={p.reviews ?? 0}
                  price={p.price} originalPrice={p.originalPrice}
                  discount={p.discountPercent} image={p.images?.[0]}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 md:mt-10 border-t border-gray-200 pt-5 md:pt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 md:px-4 py-2 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                ← Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                      page === n ? "bg-black text-white" : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 md:px-4 py-2 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
