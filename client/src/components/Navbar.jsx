/**
 * Navbar — Top navigation
 * -----------------------
 * Responsive navbar with mobile hamburger menu.
 * Shows Login/Register buttons; will show user menu when authenticated (Phase 5).
 */

import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Shared style logic for active link (works on both desktop + mobile menu)
  const linkStyle = ({ isActive }) =>
    `px-3 py-2 rounded-md font-medium transition ${
      isActive
        ? "text-indigo-600 bg-indigo-50"
        : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
    }`;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <span className="text-2xl">🫶</span>
            <span>CareAble</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={linkStyle} end>
              Home
            </NavLink>
            <NavLink to="/dashboard" className={linkStyle}>
              Dashboard
            </NavLink>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-700 font-medium hover:text-indigo-600 transition"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              // Close (X) icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-gray-100 pt-3">
            <NavLink to="/" className={linkStyle} end onClick={() => setMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/dashboard" className={linkStyle} onClick={() => setMenuOpen(false)}>
              Dashboard
            </NavLink>
            <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-md"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 text-center"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;