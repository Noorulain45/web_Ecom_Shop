interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  summary: string;
  sales: number;
  remaining: number;
  image: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const salesPct = Math.min((product.sales / 2000) * 100, 100);
  const remainPct = Math.min((product.remaining / 2000) * 100, 100);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🖨️</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{product.name}</p>
            <p className="text-xs text-gray-400">{product.category}</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{product.price}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 text-lg leading-none">⋮</button>
      </div>

      {/* Summary label */}
      <p className="text-xs font-semibold text-gray-700">Summary</p>
      <p className="text-xs text-gray-400 leading-relaxed -mt-2">{product.summary}</p>

      {/* Sales bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Sales</span>
          <span className="text-xs text-gray-700 font-medium">{product.sales.toLocaleString()}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full">
          <div className="h-1.5 bg-orange-400 rounded-full" style={{ width: `${salesPct}%` }}></div>
        </div>
      </div>

      {/* Remaining bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Remaining Products</span>
          <span className="text-xs text-gray-700 font-medium">{product.remaining.toLocaleString()}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full">
          <div className="h-1.5 bg-orange-400 rounded-full" style={{ width: `${remainPct}%` }}></div>
        </div>
      </div>
    </div>
  );
}
