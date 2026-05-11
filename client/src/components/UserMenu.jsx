// client/src/components/UserMenu.jsx

/**
 * UserMenu — Dropdown shown in the navbar when logged in.
 * --------------------------------------------------------
 * Phase 12-B: Simplified — portal switching is now handled
 * by RoleSwitcher. UserMenu shows only account-level items.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "../utils/toast";
import { useAuth } from "../hooks/useAuth";

function UserMenu() {
  const { user, logout, activeRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleNavigate = () => setOpen(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.success("Logged out. See you soon! 👋");
    navigate("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const isActive = (path) => location.pathname === path;

  // Role-aware menu items
  const isCarerContext    = activeRole === "carer";
  const isEmployerContext = activeRole === "employer";
  const isAdminContext    = activeRole === "admin";

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 p-1 pr-2.5 rounded-full transition-all ${
          open ? "bg-gray-100 ring-2 ring-indigo-500/20" : "hover:bg-gray-100"
        }`}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="relative w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-md shadow-indigo-500/30">
          {initials}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white" />
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div role="menu" className="absolute right-0 mt-3 w-72 z-50 origin-top-right animate-dropdown">
          <div className="absolute -top-1.5 right-5 w-3 h-3 bg-white rotate-45 ring-1 ring-gray-200/60" />

          <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-900/15 ring-1 ring-gray-200/60 overflow-hidden">

            {/* Header */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-5 pt-5 pb-6 overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base text-indigo-700 bg-white shadow-lg flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-indigo-200 truncate">{user?.email}</p>
                  <div className="mt-1.5 flex gap-1 flex-wrap">
                    {user?.roles?.map((role) => (
                      <span key={role} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-white/20 text-white/90">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items — role-context aware */}
            <div className="p-2">
              {isCarerContext && (
                <>
                  <MenuItem to="/dashboard" label="Dashboard" description="Your home base" icon="dashboard" active={isActive("/dashboard")} onClick={handleNavigate} />
                  <MenuItem to="/assessment" label="Assessment" description="Take a self-assessment" icon="assessment" active={isActive("/assessment")} onClick={handleNavigate} />
                </>
              )}
              {isEmployerContext && (
                <MenuItem to="/employer/dashboard" label="Employer Portal" description="Verify certificates" icon="employer" active={isActive("/employer/dashboard")} onClick={handleNavigate} />
              )}
              {isAdminContext && (
                <MenuItem to="/admin-x7k9p" label="Admin Panel" description="Manage platform" icon="admin" active={location.pathname.startsWith("/admin-x7k9p")} onClick={handleNavigate} />
              )}
              <MenuItem to="/profile" label="Profile" description="Manage your account" icon="profile" active={isActive("/profile")} onClick={handleNavigate} />
            </div>

            <div className="border-t border-gray-100" />

            {/* Logout */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                role="menuitem"
                className="group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg text-left transition"
              >
                <span className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                <span className="flex-1">Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Menu item ──────────────────────────────────────────────────────
function MenuItem({ to, label, description, icon, active, onClick }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${active ? "bg-indigo-50" : "hover:bg-gray-50"}`}
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition ${active ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30" : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"}`}>
        <ItemIcon name={icon} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${active ? "text-indigo-700" : "text-gray-900"}`}>{label}</p>
        <p className={`text-xs truncate ${active ? "text-indigo-500" : "text-gray-500"}`}>{description}</p>
      </div>
      <svg className={`w-4 h-4 transition-all ${active ? "text-indigo-500" : "text-gray-300 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

// ── Icon library ───────────────────────────────────────────────────
function ItemIcon({ name }) {
  const props = { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", strokeWidth: 2 };
  switch (name) {
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

export default UserMenu;