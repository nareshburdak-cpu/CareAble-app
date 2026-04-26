/**
 * Footer — Site footer
 * --------------------
 * Simple branding + attribution.
 */

import BRAND from "../constants/brand";

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Branding */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{BRAND.emoji}</span>
            <span className="font-bold text-gray-900">{BRAND.name}</span>
          </div>

          {/* Center: Attribution */}
          <p className="text-sm text-gray-500">{BRAND.copyrightLine}</p>

          {/* Right: Links */}
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-indigo-600 transition">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;