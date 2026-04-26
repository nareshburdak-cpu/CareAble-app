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
import BRAND from "../constants/brand";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Desktop nav link styling
  const linkStyle = ({ isActive }) =>
    `px-3 py-2 rounded-md font-medium transition ${
      isActive
        ? "text-indigo-600 bg-indigo-50"
        : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
    }`;

  // Mobile nav link styling — block layout, with left active accent bar
  const mobileLinkStyle = ({ isActive }) =>
    `relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg font-medium transition ${
      isActive
        ? "text-indigo-600 bg-indigo-50/60"
        : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
    }`;

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
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition"
            aria-label={`${BRAND.name} home`}
          >
            <span className="text-2xl">{BRAND.emoji}</span>
            <span className="text-xl font-bold text-gray-900">{BRAND.name}</span>
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
            {isAuthenticated && (
              <NavLink to="/assessment" className={linkStyle}>
                Assessment
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
            {/* User badge with avatar (when logged in) */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-indigo-50 rounded-lg">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Home */}
            <NavLink
              to="/"
              end
              className={mobileLinkStyle}
              onClick={() => setMenuOpen(false)}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                  )}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </>
              )}
            </NavLink>

            {isAuthenticated && (
              <>
                {/* Dashboard */}
                <NavLink
                  to="/dashboard"
                  className={mobileLinkStyle}
                  onClick={() => setMenuOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                      )}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>Dashboard</span>
                    </>
                  )}
                </NavLink>

                {/* Assessment */}
                <NavLink
                  to="/assessment"
                  className={mobileLinkStyle}
                  onClick={() => setMenuOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                      )}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span>Assessment</span>
                    </>
                  )}
                </NavLink>

                {/* Profile */}
                <NavLink
                  to="/profile"
                  className={mobileLinkStyle}
                  onClick={() => setMenuOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                      )}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </>
                  )}
                </NavLink>
              </>
            )}

            {/* Auth actions */}
            <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={handleMobileLogout}
                  className="w-full flex items-center gap-3 pl-4 pr-3 py-2.5 text-red-600 font-medium hover:bg-red-50 rounded-lg text-left"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
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