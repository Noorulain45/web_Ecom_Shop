const footerLinks = {
  Company: ["Home", "About", "News", "Careers"],
  "Help": ["Customer Support", "Delivery Details", "Terms & Conditions", "Privacy Policy"],
  FAQ: ["Account", "Manage Deliveries", "Orders", "Payments"],
  Resources: ["Free eBooks", "Development Tutorial", "How to Blog", "Youtube Playlist"],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-4">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <span className="text-xl font-extrabold tracking-tight">SHOP.CO</span>
            <p className="text-gray-500 text-xs mt-3 leading-relaxed">
              We have clothes that suit your style and which you're proud to wear. From women to men.
            </p>
            <div className="flex gap-3 mt-4">
              {["𝕏", "f", "in", "▶"].map((icon) => (
                <button key={icon} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-xs hover:bg-gray-100">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 md:mb-4">{section}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-500 text-sm hover:text-black transition">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 mt-8 md:mt-10 pt-5 md:pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs">Shop.co © 2000-2023, All Rights Reserved</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Visa", "MC", "Amex", "Apple Pay", "G Pay"].map((pay) => (
              <span key={pay} className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-500">{pay}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
