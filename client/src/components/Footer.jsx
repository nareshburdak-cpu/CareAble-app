import { Link } from "react-router-dom";
import BRAND from "../constants/brand";

function Footer() {
  return (
    <footer className="bg-gradient-to-b from-stone-50 to-stone-100 border-t border-stone-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-6 md:pt-16 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-10">
          {/* Brand block */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
              <span className="text-3xl group-hover:scale-110 transition-transform">{BRAND.emoji}</span>
              <span className="font-serif font-bold text-2xl text-stone-900 group-hover:text-indigo-700 transition">
                {BRAND.name}
              </span>
            </Link>
            <p className="text-sm text-stone-600 leading-relaxed mb-5 max-w-sm">
              {BRAND.tagline}. Helping unpaid carers turn everyday caregiving into recognised, professional capability.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-stone-600">
                In partnership with{" "}
                <span className="font-semibold text-stone-900">{BRAND.partnersLine}</span>
              </span>
            </div>
          </div>

          {/* Spacer column on desktop */}
          <div className="hidden md:block md:col-span-1" />

          {/* Product links */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/about">About</FooterLink>
              <FooterLink to="/register">Get started</FooterLink>
              <FooterLink to="/login">Log in</FooterLink>
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              <FooterLink to="/privacy">Privacy policy</FooterLink>
              <FooterLink to="/terms">Terms of service</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
              <li>
                <a href={`mailto:${BRAND.supportEmail}`} className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-indigo-700 transition group">
                  <svg className="w-3.5 h-3.5 text-stone-400 group-hover:text-indigo-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {BRAND.supportEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-200" />

        {/* Bottom strip */}
        <div className="pt-6 flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            {BRAND.copyrightLine}. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-stone-500">
              Made with care
              <span className="text-base">🫶</span>
            </span>
            <span className="text-stone-300">·</span>
            <span className="font-mono text-stone-400 px-2 py-0.5 bg-white border border-stone-200 rounded-md" title="Build version">
              v{BRAND.version}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-indigo-700 transition group">
        <span className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-600">→</span>
        <span>{children}</span>
      </Link>
    </li>
  );
}

export default Footer;