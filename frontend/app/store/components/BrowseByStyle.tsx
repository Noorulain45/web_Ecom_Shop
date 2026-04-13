import Link from "next/link";
import Image from "next/image";

const styles = [
  { label: "Casual", image: "/casual-style.png" },
  { label: "Formal", image: "/formal-style.png" },
  { label: "Party",  image: "/party-style.png"  },
  { label: "Gym",    image: "/gym-style.png"    },
];

export default function BrowseByStyle() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="bg-[#f0eeed] rounded-2xl p-4 md:p-8">
        <h2 className="text-2xl md:text-3xl font-black uppercase text-center mb-6 md:mb-8">
          Browse By Dress Style
        </h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {styles.map(({ label, image }) => (
            <Link
              key={label}
              href={`/store/category/${label.toLowerCase()}`}
              className="relative bg-white rounded-xl overflow-hidden h-32 sm:h-40 md:h-44 cursor-pointer hover:shadow-md transition"
            >
              <Image
                src={image}
                alt={label}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, 33vw"
              />
              <span className="absolute bottom-3 left-3 text-sm font-bold text-white drop-shadow">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
