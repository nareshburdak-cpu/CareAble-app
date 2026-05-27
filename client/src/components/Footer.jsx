import { Link } from "react-router-dom";
import BRAND from "../constants/brand";

const PRODUCT_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/register", label: "Get started" },
  { to: "/login", label: "Log in" },
];

const RESOURCE_LINKS = [
  { to: "/privacy", label: "Privacy policy" },
  { to: "/terms", label: "Terms of service" },
  { to: "/contact", label: "Contact" },
];

const SUPPORT_LINKS = [
  { to: "/help", label: "Help centre" },
  { to: "/accessibility", label: "Accessibility" },
];

const EmailIcon = () => (
  <svg
    className="w-3.5 h-3.5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

function FooterLink({ to, label }) {
  return (
    <li>
      <Link
        to={to}
        className="group inline-flex items-center text-sm text-stone-500 hover:text-indigo-600 transition-colors duration-150"
      >
        {label}
        <span className="ml-0 text-xs text-indigo-500 opacity-0 -translate-x-1 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-150">
          {"->"}
        </span>
      </Link>
    </li>
  );
}

function ColLabel({ children }) {
  return (
    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
      {children}
    </p>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-gradient-to-b from-stone-50 to-[#f5f4f1]">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-6">
        <div className="mb-8 hidden gap-10 md:grid md:grid-cols-[1.8fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="group mb-3 inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-gradient-to-br from-teal-50 to-blue-50 transition-transform duration-200 group-hover:scale-105">
                <img
                  src="/logo-icon.png"
                  alt=""
                  className="h-5 w-5 object-contain"
                  aria-hidden="true"
                />
              </div>
              <span className="text-xl font-bold text-stone-900">{BRAND.text}</span>
            </Link>

            <p className="mb-4 max-w-[220px] text-sm leading-relaxed text-stone-500">
              Turning caregiving into recognised professional capability.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-stone-600">
                In partnership with{" "}
                <span className="font-semibold text-stone-900">{BRAND.partnersLine}</span>
              </span>
            </div>
          </div>

          <div>
            <ColLabel>Product</ColLabel>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map(({ to, label }) => (
                <FooterLink key={to} to={to} label={label} />
              ))}
            </ul>
          </div>

          <div>
            <ColLabel>Resources</ColLabel>
            <ul className="space-y-2.5">
              {RESOURCE_LINKS.map(({ to, label }) => (
                <FooterLink key={to} to={to} label={label} />
              ))}
            </ul>
          </div>

          <div>
            <ColLabel>Support</ColLabel>
            <ul className="mb-4 space-y-2.5">
              {SUPPORT_LINKS.map(({ to, label }) => (
                <FooterLink key={to} to={to} label={label} />
              ))}
            </ul>

            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors duration-150 hover:text-indigo-600"
            >
              <EmailIcon />
              {BRAND.supportEmail}
            </a>
          </div>
        </div>

        <div className="mb-6 md:hidden">
          <div className="mb-4 flex items-center justify-between">
            <Link to="/" className="group inline-flex items-center gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-gradient-to-br from-teal-50 to-blue-50 transition-transform duration-200 group-hover:scale-105">
                <img
                  src="/logo-icon.png"
                  alt=""
                  className="h-5 w-5 object-contain"
                  aria-hidden="true"
                />
              </div>
              <span className="text-xl font-bold text-stone-900">{BRAND.text}</span>
            </Link>
            <span className="rounded-md border border-stone-200 bg-white px-2 py-0.5 font-mono text-xs text-stone-400">
              {`v${BRAND.version}`}
            </span>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-stone-500">
            Turning caregiving into recognised professional capability.
          </p>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-stone-600">
              In partnership with{" "}
              <span className="font-semibold text-stone-900">{BRAND.partnersLine}</span>
            </span>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3">
            {[...PRODUCT_LINKS, ...RESOURCE_LINKS, ...SUPPORT_LINKS].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm font-medium text-stone-600 transition-colors duration-150 hover:text-indigo-600"
              >
                {label}
              </Link>
            ))}
          </div>

          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors duration-150 hover:text-indigo-600"
          >
            <EmailIcon />
            {BRAND.supportEmail}
          </a>
        </div>

        <div className="flex flex-col-reverse items-start justify-between gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center">
          <p className="text-xs text-stone-500">
            {BRAND.copyrightLine}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-stone-500">
              Made with care
            </span>
            <span className="text-stone-300">|</span>
            <span className="rounded-md border border-stone-200 bg-white px-2 py-0.5 font-mono text-xs text-stone-400">
              {`v${BRAND.version}`}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
