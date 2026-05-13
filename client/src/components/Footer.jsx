import { Link } from "react-router-dom";
import BRAND from "../constants/brand";

const LEFT_LINKS = [
  { to: "/",         label: "Home"        },
  { to: "/about",    label: "About"       },
  { to: "/register", label: "Get started" },
];

const RIGHT_LINKS = [
  { to: "/privacy",  label: "Privacy policy"  },
  { to: "/terms",    label: "Terms of service" },
  { to: "/contact",  label: "Contact"          },
];

function Footer() {
  return (
    <footer className="bg-gradient-to-b from-stone-50 to-stone-100 border-t border-stone-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-6 md:pt-16 md:pb-8">

        {/* ── DESKTOP grid (md+) ── */}
        <div className="hidden md:grid md:grid-cols-12 gap-8 mb-10">

          {/* Brand block */}
          <div className="col-span-5">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <img src="/logo-icon.png" alt="" className="w-9 h-9 object-contain group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
              <span className="text-2xl font-bold text-stone-900">{BRAND.text}</span>
            </Link>            
            <p className="text-sm text-stone-500 leading-relaxed mb-5 max-w-xs">{BRAND.tagline}. Helping unpaid carers turn everyday caregiving into recognised, professional capability.</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-stone-600">In partnership with{" "}<span className="font-semibold text-stone-900">{BRAND.partnersLine}</span></span>
            </div>
          </div>

          <div className="col-span-1" />

          {/* Product */}
          <div className="col-span-3">
            <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">Product</h3>
            <ul className="space-y-2.5">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/about">About</FooterLink>
              <FooterLink to="/register">Get started</FooterLink>
              <FooterLink to="/login">Log in</FooterLink>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-3">
            <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">Resources</h3>
            <ul className="space-y-2.5">
              <FooterLink to="/privacy">Privacy policy</FooterLink>
              <FooterLink to="/terms">Terms of service</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
              <li>
                <a href={"mailto:" + BRAND.supportEmail} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-indigo-600 transition group">
                  <svg className="w-3.5 h-3.5 text-stone-400 group-hover:text-indigo-500 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {BRAND.supportEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── MOBILE layout (below md) ── */}
        <div className="md:hidden mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <img src="/logo-icon.png" alt="" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" aria-hidden="true" />
              <span className="text-xl font-bold text-stone-900">{BRAND.text}</span>
            </Link>
           <span className="font-mono text-xs text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">{"v" + BRAND.version}</span>
          </div>

          <p className="text-sm text-stone-500 leading-relaxed mb-5">{BRAND.tagline}.</p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
            <div className="flex flex-col gap-3">
              {LEFT_LINKS.map(function(item) {
                return <Link key={item.to} to={item.to} className="text-sm font-medium text-stone-600 hover:text-indigo-600 transition">{item.label}</Link>;
              })}
            </div>
            <div className="flex flex-col gap-3">
              {RIGHT_LINKS.map(function(item) {
                return <Link key={item.to} to={item.to} className="text-sm font-medium text-stone-600 hover:text-indigo-600 transition">{item.label}</Link>;
              })}
            </div>
          </div>

          <a href={"mailto:" + BRAND.supportEmail} className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-indigo-600 transition">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {BRAND.supportEmail}
          </a>
        </div>

        {/* ── Bottom strip (both) ── */}
        <div className="border-t border-stone-200 pt-6 flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-stone-400">{BRAND.copyrightLine}. All rights reserved.</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-stone-400">Made with care <span className="text-base">🫶</span></span>
            <span className="text-stone-300">·</span>
            <span className="font-mono text-stone-400 px-2 py-0.5 bg-white border border-stone-200 rounded-md">{"v" + BRAND.version}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-indigo-600 transition group">
        <span className="opacity-0 group-hover:opacity-100 -translate-x-1.5 group-hover:translate-x-0 transition-all duration-200 text-indigo-500 text-xs">→</span>
        <span>{children}</span>
      </Link>
    </li>
  );
}

export default Footer;