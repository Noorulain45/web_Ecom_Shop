export default function Hero() {
  return (
    <section
      className="overflow-hidden relative min-h-[360px] md:min-h-[480px]"
      style={{
        backgroundImage: "url('/Rectangle 2.png')",
        backgroundSize: "cover",
        backgroundPosition: "center right",
        backgroundColor: "#f2f0f1",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8 relative">
        {/* Text side */}
        <div className="flex-1 z-10 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase leading-tight tracking-tight mb-4">
            Find Clothes<br />That Matches<br />Your Style
          </h1>
          <p className="text-gray-500 text-sm max-w-sm mb-6 mx-auto md:mx-0">
            Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.
          </p>
          <button className="bg-black text-white rounded-full px-8 py-3 text-sm font-semibold hover:bg-gray-800 transition">
            Shop Now
          </button>

          {/* Stats */}
          <div className="flex gap-4 md:gap-8 mt-10 justify-center md:justify-start flex-wrap">
            {[
              { value: "200+", label: "International Brands" },
              { value: "2,000+", label: "High-Quality Products" },
              { value: "30,000+", label: "Happy Customers" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl md:text-2xl font-extrabold">{stat.value}</p>
                <p className="text-gray-500 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative stars */}
        <span className="absolute top-8 right-[45%] text-4xl select-none z-10 hidden md:block">✦</span>
        <span className="absolute bottom-16 right-[38%] text-2xl select-none z-10 hidden md:block">✦</span>

        <div className="flex-1 min-h-[200px] md:min-h-[320px]" />
      </div>
    </section>
  );
}
