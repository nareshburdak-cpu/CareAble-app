/**
 * AdminLayout
 * -----------
 * Persistent layout for all admin pages.
 *
 * Has a sidebar with nav links and an outlet for the active page.
 * Uses `<Outlet />` from React Router so child routes render in the main area.
 */

import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-stone-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 hidden md:flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200">
          <Link to="/admin-x7k9p" className="block">
            <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-1">
              CareAble
            </p>
            <h1 className="font-serif text-lg font-bold text-stone-900">
              Admin Panel
            </h1>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarLink to="/admin-x7k9p" end label="Analytics" icon="chart" />
          <SidebarLink to="/admin-x7k9p/users" label="Users" icon="users" />
          <SidebarLink to="/admin-x7k9p/questions" label="Questions" icon="question" />
          <SidebarLink to="/admin-x7k9p/audit" label="Audit Log" icon="audit" /> 
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-stone-500 truncate">Admin</p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="block w-full text-center px-3 py-2 text-xs text-stone-600 hover:text-indigo-700 border border-stone-200 hover:border-indigo-300 rounded-lg transition"
          >
            ← Exit admin
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-stone-200 px-4 py-3 z-30">
        <h1 className="font-serif font-bold text-stone-900">Admin Panel</h1>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="md:hidden h-12" /> {/* spacer for mobile header */}
        <Outlet />
      </main>
    </div>
  );
}

// ---- Sidebar nav link ----
function SidebarLink({ to, end, label, icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        }`
      }
    >
      <SidebarIcon name={icon} />
      <span>{label}</span>
    </NavLink>
  );
}

// ---- Icons ----
function SidebarIcon({ name }) {
  const props = {
    className: "w-4 h-4 flex-shrink-0",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  };

  switch (name) {
    case "chart":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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