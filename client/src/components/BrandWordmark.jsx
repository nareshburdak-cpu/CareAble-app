// client/src/components/BrandWordmark.jsx

/**
 * BrandWordmark
 * -------------
 * Renders the "CareAble" logotype in brand colours sourced from brand.js.
 *   "Care" → BRAND.colors.care  (#40aa9b teal)
 *   "Able" → BRAND.colors.able  (#2c6bc2 blue)
 *
 * Scales to whatever font size you pass via className.
 * No SVG file, no image — pure text, always crisp at any size.
 *
 * Usage:
 *   <BrandWordmark className="text-xl" />            // navbar
 *   <BrandWordmark className="text-2xl" />           // footer desktop
 *   <BrandWordmark className="text-3xl font-bold" /> // auth pages
 */

import BRAND from "../constants/brand";

function BrandWordmark({ className = "text-2xl" }) {
  return (
    <span
      className={`font-bold tracking-tight leading-none select-none ${className}`}
      style={{ fontFamily: BRAND.fontStack }}
      aria-label={BRAND.name}
    >
      <span style={{ color: BRAND.colors.care }}>Care</span>
      <span style={{ color: BRAND.colors.able }}>Able</span>
    </span>
  );
}

export default BrandWordmark;