// client/src/components/RoleSwitcher.jsx

/**
 * RoleSwitcher
 * ------------
 * Persistent role context indicator in the navbar.
 *
 * - Single role user: shows a static badge (no interaction needed)
 * - Multi-role user: badge is clickable, opens a popover to switch
 * - Switching navigates to the correct portal and updates activeRole
 *
 * Rendered in two modes:
 *   mode="navbar"  — compact pill for desktop navbar
 *   mode="drawer"  — full-width list item for mobile hamburger drawer
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ROLE_META = {
  carer: {
    label: "Carer",
    icon: "🤝",
    description: "Assessments & certificates",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    activeColor: "bg-indigo-600 text-white border-indigo-600",
    dotColor: "bg-indigo-500",
  },
  employer: {
    label: "Employer",
    icon: "🏢",
    description: "Certificate verification",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    activeColor: "bg-emerald-600 text-white border-emerald-600",
    dotColor: "bg-emerald-500",
  },
  admin: {
    label: "Admin",
    icon: "⚙️",
    description: "Platform management",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    activeColor: "bg-amber-500 text-white border-amber-500",
    dotColor: "bg-amber-500",
  },
};

export default function RoleSwitcher({ mode = "navbar", onNavigate }) {
  const { user, activeRole, switchRole, roleDestination } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const roles = user?.roles || [];
  const isMultiRole = roles.length > 1;
  const meta = ROLE_META[activeRole] || ROLE_META.carer;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
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

  const handleSwitch = (role) => {
    switchRole(role);
    setOpen(false);
    onNavigate?.();
    navigate(roleDestination(role));
  };

  // ── Drawer mode (mobile) ──────────────────────────────────────────
  if (mode === "drawer") {
    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
          Active role
        </p>
        {roles.map((role) => {
          const m = ROLE_META[role];
          const isActive = role === activeRole;
          return (
            <button
              key={role}
              onClick={() => handleSwitch(role)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-indigo-50 border border-indigo-200"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
                isActive ? "bg-indigo-600 shadow-sm" : "bg-gray-100"
              }`}>
                {m?.icon}
              </span>
              <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-semibold ${isActive ? "text-indigo-700" : "text-gray-700"}`}>
                  {m?.label}
                </p>
                <p className={`text-xs truncate ${isActive ? "text-indigo-500" : "text-gray-400"}`}>
                  {m?.description}
                </p>
              </div>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Navbar mode (desktop) ─────────────────────────────────────────
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => isMultiRole && setOpen((v) => !v)}
        title={isMultiRole ? "Switch role" : `Active role: ${meta.label}`}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
          isMultiRole
            ? `${meta.color} hover:opacity-80 cursor-pointer`
            : `${meta.color} cursor-default`
        }`}
      >
        <span className="text-sm leading-none">{meta.icon}</span>
        <span>{meta.label}</span>
        {isMultiRole && (
          <svg
            className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Popover */}
      {open && isMultiRole && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Switch role
            </p>
          </div>
          <div className="p-2">
            {roles.map((role) => {
              const m = ROLE_META[role];
              const isActive = role === activeRole;
              return (
                <button
                  key={role}
                  onClick={() => handleSwitch(role)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
                    isActive ? "bg-indigo-600" : "bg-gray-100"
                  }`}>
                    {m?.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{m?.label}</p>
                    <p className="text-xs text-gray-400 truncate">{m?.description}</p>
                  </div>
                  {isActive && (
                    <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}