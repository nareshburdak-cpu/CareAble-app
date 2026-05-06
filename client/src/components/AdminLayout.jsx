/**
 * AdminLayout
 * -----------
 * Persistent layout for all admin pages.
 *
 * Desktop: fixed sidebar with sticky header/footer, scrollable nav area.
 * Mobile: top bar with slide-out drawer (hamburger menu).
 */

import { useState, useEffect } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/vite.svg";

const NAV_ITEMS = [
  { to: "/admin-x7k9p", end: true, label: "Analytics",   icon: "chart"    },
  { to: "/admin-x7k9p/users",      label: "Users",       icon: "users"    },
  { to: "/admin-x7k9p/categories", label: "Categories",  icon: "folder"   },
  { to: "/admin-x7k9p/questions",  label: "Questions",   icon: "question" },
  { to: "/admin-x7k9p/audit",      label: "Audit Log",   icon: "audit"    },
];

function AdminLayout() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const initials = user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "A";
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : "Admin";

  return (
    <div className="flex min-h-screen bg-stone-50">

      {/* ── Desktop Sidebar ── */}
      <aside className="w-60 bg-white border-r border-stone-200 hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-20">

        {/* Brand */}
        <Link to="/admin-x7k9p" className="flex items-center gap-2.5 px-5 py-4 border-b border-stone-100 hover:bg-stone-50 transition group">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
            <img src={logo} alt="CareAble" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold leading-none mb-0.5">CareAble</p>
            <p className="text-sm font-bold text-stone-800 leading-none">Admin Panel</p>
          </div>
        </Link>

        {/* Nav — scrollable if many items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>

        {/* Footer — always visible, sticky to bottom */}
        <div className="border-t border-stone-100 p-3 space-y-2 bg-white">
          {/* User info */}
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-stone-50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-800 truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-stone-400 leading-tight">{roleLabel}</p>
            </div>
          </div>
          {/* Exit admin */}
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-stone-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-stone-200 hover:border-indigo-200 rounded-lg transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-stone-200 px-4 py-3 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center p-1">
            <img src={logo} alt="CareAble" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-stone-900 text-sm">Admin Panel</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ── Mobile Drawer Overlay ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-2xl transform transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
              <img src={logo} alt="CareAble" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold leading-none mb-0.5">CareAble</p>
              <p className="text-sm font-bold text-stone-800 leading-none">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} mobile onNavigate={() => setDrawerOpen(false)} />
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="border-t border-stone-100 p-4 space-y-3 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate">{user?.name}</p>
              <p className="text-xs text-stone-400">{roleLabel}</p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-stone-200 hover:border-indigo-200 rounded-xl transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Exit Admin
          </Link>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto md:ml-60">
        {/* Spacer for mobile top bar */}
        <div className="md:hidden h-[57px]" />
        <Outlet />
      </main>
    </div>
  );
}

// ---- Sidebar nav link ----
function SidebarLink({ to, end, label, icon, mobile, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
        } ${mobile ? "py-3" : ""}`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex-shrink-0 ${isActive ? "text-indigo-600" : "text-stone-400"}`}>
            <SidebarIcon name={icon} />
          </span>
          <span>{label}</span>
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
          )}
        </>
      )}
    </NavLink>
  );
}

// ---- Icons ----
function SidebarIcon({ name }) {
  const props = {
    className: "w-4 h-4",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  };

  switch (name) {
    case "chart":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "folder":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case "question":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "audit":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default AdminLayout;