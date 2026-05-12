import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ROLE_META = {
  carer:    { label: "Carer",    icon: "🤝", description: "Assessments & certificates", pill: "bg-indigo-50 text-indigo-700 border-indigo-200",  activePill: "bg-indigo-600 text-white border-indigo-600"  },
  employer: { label: "Employer", icon: "🏢", description: "Certificate verification",  pill: "bg-emerald-50 text-emerald-700 border-emerald-200", activePill: "bg-emerald-600 text-white border-emerald-600" },
  admin:    { label: "Admin",    icon: "⚙️", description: "Platform management",       pill: "bg-amber-50 text-amber-700 border-amber-200",       activePill: "bg-amber-500 text-white border-amber-500"     },
};

export default function RoleSwitcher({ mode = "navbar", onNavigate }) {
  const { user, activeRole, switchRole, roleDestination } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const roles = user?.roles || [];
  const isMultiRole = roles.length > 1;
  const meta = ROLE_META[activeRole] || ROLE_META.carer;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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

  // Drawer mode — hidden for carer-only, pill row for multi-role
  if (mode === "drawer") {
    if (!isMultiRole) return null;
    return (
      <div className="px-3 py-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Switch role</p>
        <div className="flex gap-1.5 flex-wrap">
          {roles.map((role) => {
            const m = ROLE_META[role];
            const isActive = role === activeRole;
            return (
              <button key={role} onClick={() => handleSwitch(role)}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all " + (isActive ? m.activePill : m.pill + " hover:opacity-80")}>
                <span>{m?.icon}</span>
                <span>{m?.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/80" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Navbar mode (desktop)
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => isMultiRole && setOpen((v) => !v)}
        title={isMultiRole ? "Switch role" : "Active role: " + meta.label}
        className={"flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all " + (isMultiRole ? meta.pill + " hover:opacity-80 cursor-pointer" : meta.pill + " cursor-default")}>
        <span className="text-sm leading-none">{meta.icon}</span>
        <span>{meta.label}</span>
        {isMultiRole && (
          <svg className={"w-3 h-3 transition-transform " + (open ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && isMultiRole && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Switch role</p>
          </div>
          <div className="p-1.5">
            {roles.map((role) => {
              const m = ROLE_META[role];
              const isActive = role === activeRole;
              return (
                <button key={role} onClick={() => handleSwitch(role)}
                  className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all " + (isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-700")}>
                  <span className={"w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 " + (isActive ? "bg-indigo-600" : "bg-gray-100")}>{m?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{m?.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{m?.description}</p>
                  </div>
                  {isActive && <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}