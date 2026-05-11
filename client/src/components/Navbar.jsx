// client/src/components/Navbar.jsx

/**
 * Navbar — Top navigation
 * -----------------------
 * Phase 12-B: Role switcher integrated.
 * Nav links adapt to active role context:
 *   carer    → Dashboard, Assessment
 *   employer → Employer Portal
 *   admin    → Admin Panel link
 */

import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import toast from "../utils/toast";
import { useAuth } from "../hooks/useAuth";
import UserMenu from "./UserMenu";
import RoleSwitcher from "./RoleSwitcher";
import BRAND from "../constants/brand";

function Navbar() {
  const { isAuthenticated, user, logout, activeRole } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleMobileLogout = () => {
    logout();
    setMenuOpen(false);
    toast.success("Logged out. See you soon! 👋");
    navigate("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const linkStyle = ({ isActive }) =>
    `px-3 py-2 rounded-md font-medium transition ${
      isActive
        ? "text-indigo-600 bg-indigo-50"
        : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
    }`;

  // Defensive: use activeRole from context, fall back to first role if null
  const effectiveRole = activeRole
    || (user?.roles?.includes("admin") ? "admin"
      : user?.roles?.includes("employer") ? "employer"
      : "carer");

  const showCarerNav    = isAuthenticated && effectiveRole === "carer";
  const showEmployerNav = isAuthenticated && effectiveRole === "employer";
  const showAdminNav    = isAuthenticated && effectiveRole === "admin";

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-2 hover:opacity-80 transition"
            aria-label={`${BRAND.name} home`}
          >
            <span className="text-2xl">{BRAND.emoji}</span>
            <span className="text-xl font-bold text-gray-900">{BRAND.name}</span>
          </Link>

          {/* Desktop nav links — role-aware */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={linkStyle} end>
              Home
            </NavLink>

            {showCarerNav && (
              <>
                <NavLink to="/dashboard" className={linkStyle}>
                  Dashboard
                </NavLink>
                <NavLink to="/assessment" className={linkStyle}>
                  Assessment
                </NavLink>
              </>
            )}

            {showEmployerNav && (
              <NavLink to="/employer/dashboard" className={linkStyle}>
                Employer Portal
              </NavLink>
            )}

            {showAdminNav && (
              <NavLink to="/admin-x7k9p" className={linkStyle}>
                Admin Panel
              </NavLink>
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <RoleSwitcher mode="navbar" />
                <UserMenu />
              </>
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
            className={`md:hidden p-2 rounded-md transition ${
              menuOpen ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 top-16 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          />

          <div className="fixed top-16 left-0 right-0 bg-white shadow-2xl z-50 md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-4 space-y-2">

              {/* User card */}
              {isAuthenticated && user && (
                <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-5 mb-4 overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base text-indigo-700 bg-white shadow-lg flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-indigo-200 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Role switcher in drawer */}
              {isAuthenticated && (
                <div className="pb-2 mb-2 border-b border-gray-100">
                  <RoleSwitcher mode="drawer" onNavigate={closeMenu} />
                </div>
              )}

              {/* Nav links — role-aware */}
              <MobileNavItem to="/" end label="Home" description="Welcome page" icon="home" onClick={closeMenu} />

              {isAuthenticated && showCarerNav && (
                <>
                  <MobileNavItem to="/dashboard" label="Dashboard" description="Your home base" icon="dashboard" onClick={closeMenu} />
                  <MobileNavItem to="/assessment" label="Assessment" description="Take a self-assessment" icon="assessment" onClick={closeMenu} />
                  <MobileNavItem to="/profile" label="Profile" description="Manage your account" icon="profile" onClick={closeMenu} />
                </>
              )}

              {isAuthenticated && showEmployerNav && (
                <>
                  <MobileNavItem to="/employer/dashboard" label="Employer Portal" description="Verify caregiver certificates" icon="employer" onClick={closeMenu} />
                  <MobileNavItem to="/profile" label="Profile" description="Manage your account" icon="profile" onClick={closeMenu} />
                </>
              )}

              {isAuthenticated && showAdminNav && (
                <>
                  <MobileNavItem to="/admin-x7k9p" label="Admin Panel" description="Platform management" icon="admin" onClick={closeMenu} />
                  <MobileNavItem to="/profile" label="Profile" description="Manage your account" icon="profile" onClick={closeMenu} />
                </>
              )}

              {/* Auth actions */}
              <div className="pt-3 mt-3 border-t border-gray-100">
                {isAuthenticated ? (
                  <button
                    onClick={handleMobileLogout}
                    className="group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg text-left transition"
                  >
                    <span className="w-9 h-9 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </span>
                    <span>Log out</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={closeMenu} className="block w-full px-4 py-2.5 text-center text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition border border-gray-200">
                      Log in
                    </Link>
                    <Link to="/register" onClick={closeMenu} className="block w-full px-4 py-2.5 text-center bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm">
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

// ── Mobile nav item ────────────────────────────────────────────────
function MobileNavItem({ to, end, label, description, icon, onClick }) {
  return (
    <NavLink to={to} end={end} onClick={onClick}>
      {({ isActive }) => (
        <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition ${isActive ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30" : "bg-gray-100 text-gray-600"}`}>
            <NavIcon name={icon} />
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${isActive ? "text-indigo-700" : "text-gray-900"}`}>{label}</p>
            <p className={`text-xs truncate ${isActive ? "text-indigo-500" : "text-gray-500"}`}>{description}</p>
          </div>
          {isActive && (
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      )}
    </NavLink>
  );
}

// ── Icon library ───────────────────────────────────────────────────
function NavIcon({ name }) {
  const props = { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", strokeWidth: 2 };
  switch (name) {
    case "home":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case "dashboard":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case "assessment":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    case "profile":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
    case "employer":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
    case "admin":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    default:
      return null;
  }
}

export default Navbar;