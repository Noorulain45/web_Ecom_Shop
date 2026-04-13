import Image from "next/image";

const brands = [
  { name: "Versace", src: "/versace.png" },
  { name: "Zara", src: "/zara.png" },
  { name: "Gucci", src: "/gucci.png" },
  { name: "Prada", src: "/parada.png" },
  { name: "Calvin Klein", src: "/ck.png" },
];

export default function Brands() {
  return (
    <div className="bg-black py-5">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-center md:justify-between flex-wrap gap-6">
        {brands.map((brand) => (
          <div key={brand.name} className="relative h-7 w-24 md:h-8 md:w-32">
            <Image src={brand.src} alt={brand.name} fill className="object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}
