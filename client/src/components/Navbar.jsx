/**
 * Navbar — Top navigation
 * -----------------------
 * Reacts to auth state:
 *   - Logged out: shows Log in + Sign up buttons
 *   - Logged in: shows UserMenu dropdown
 *   - "Dashboard" link only shows when logged in
 */

import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import UserMenu from "./UserMenu";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkStyle = ({ isActive }) =>
    `px-3 py-2 rounded-md font-medium transition ${
      isActive
        ? "text-indigo-600 bg-indigo-50"
        : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
    }`;

  // Mobile logout helper
  const handleMobileLogout = () => {
    logout();
    setMenuOpen(false);
    toast.success("Logged out. See you soon! 👋");
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <span className="text-2xl">🫶</span>
            <span>CareAble</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={linkStyle} end>
              Home
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/dashboard" className={linkStyle}>
                Dashboard
              </NavLink>
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-gray-100 pt-3">
            {/* User badge (when logged in) */}
            {isAuthenticated && user && (
              <div className="px-3 py-2 mb-2 bg-indigo-50 rounded-md">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            )}

            <NavLink to="/" className={linkStyle} end onClick={() => setMenuOpen(false)}>
              Home
            </NavLink>

            {isAuthenticated && (
              <NavLink to="/dashboard" className={linkStyle} onClick={() => setMenuOpen(false)}>
                Dashboard
              </NavLink>
            )}

            {/* Auth actions */}
            <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={handleMobileLogout}
                  className="w-full px-3 py-2 text-red-600 font-medium hover:bg-red-50 rounded-md text-left"
                >
                  Log out
                </button>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;