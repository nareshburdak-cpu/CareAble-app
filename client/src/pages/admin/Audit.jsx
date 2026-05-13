/**
 * Admin: Audit Log
 * ----------------
 * Read-only list of every admin action performed.
 * Improved: richer rows with action-type icons, colour-coded left border,
 * scrollable filter tabs, mobile-friendly layout, better timestamp display.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";

/* ─── action metadata ────────────────────────────────────────────── */
const ACTIONS = {
  // User actions
  "user.verify":      { label: "Force-verified email",  color: "emerald", icon: "✓",  group: "user" },
  "user.unverify":    { label: "Unverified email",       color: "amber",   icon: "!",  group: "user" },
  "user.promote":     { label: "Promoted to admin",      color: "purple",  icon: "↑",  group: "user" },
  "user.demote":      { label: "Demoted from admin",     color: "stone",   icon: "↓",  group: "user" },
  "user.deactivate":  { label: "Deactivated account",   color: "red",     icon: "✕",  group: "user" },
  "user.reactivate":  { label: "Reactivated account",   color: "emerald", icon: "↺",  group: "user" },
  "user.addRole":     { label: "Added role",             color: "indigo",  icon: "+",  group: "user" },
  "user.removeRole":  { label: "Removed role",           color: "amber",   icon: "−",  group: "user" },
  // Question actions
  "question.create":  { label: "Created question",       color: "indigo",  icon: "+",  group: "question" },
  "question.update":  { label: "Updated question",       color: "stone",   icon: "✎",  group: "question" },
  "question.archive": { label: "Archived question",      color: "amber",   icon: "▽",  group: "question" },
  "question.restore": { label: "Restored question",      color: "emerald", icon: "↺",  group: "question" },
  "question.reorder": { label: "Reordered questions",    color: "stone",   icon: "⇅",  group: "question" },
  // Category actions
  "category.create":  { label: "Created domain",         color: "indigo",  icon: "+",  group: "category" },
  "category.update":  { label: "Updated domain",         color: "stone",   icon: "✎",  group: "category" },
  "category.archive": { label: "Archived domain",        color: "amber",   icon: "▽",  group: "category" },
  "category.restore": { label: "Restored domain",        color: "emerald", icon: "↺",  group: "category" },
  "category.reorder": { label: "Reordered domains",      color: "stone",   icon: "⇅",  group: "category" },
  // Settings
  "setting.update":   { label: "Updated setting",        color: "indigo",  icon: "⚙",  group: "setting" },
};

/* ─── colour map ─────────────────────────────────────────────────── */
const COLOR = {
  emerald: { badge: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-400", dot: "bg-emerald-400" },
  amber:   { badge: "bg-amber-100 text-amber-700",     border: "border-l-amber-400",   dot: "bg-amber-400"   },
  red:     { badge: "bg-red-100 text-red-700",         border: "border-l-red-400",     dot: "bg-red-400"     },
  purple:  { badge: "bg-purple-100 text-purple-700",   border: "border-l-purple-400",  dot: "bg-purple-400"  },
  indigo:  { badge: "bg-indigo-100 text-indigo-700",   border: "border-l-indigo-400",  dot: "bg-indigo-400"  },
  stone:   { badge: "bg-stone-100 text-stone-600",     border: "border-l-stone-300",   dot: "bg-stone-300"   },
};

/* ─── filter tabs ────────────────────────────────────────────────── */
const FILTERS = [
  { key: "all",      label: "All",        icon: "📋" },
  { key: "user",     label: "Users",      icon: "👤" },
  { key: "question", label: "Questions",  icon: "❓" },
  { key: "category", label: "Domains",    icon: "🗂️" },
  { key: "setting",  label: "Settings",   icon: "⚙️" },
];

/* ─── relative time ──────────────────────────────────────────────── */
function relativeTime(date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 10080) return `${Math.floor(mins / 1440)}d ago`;
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── main ───────────────────────────────────────────────────────── */
function Audit() {
  const [logs, setLogs]             = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [filter, setFilter]         = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/audit", { params: { page, limit: 50 } });
      setLogs(res.data.data.logs);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.message || "Could not load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = filter === "all"
    ? logs
    : logs.filter((l) => l.action.startsWith(filter));

  return (
    <div className="p-4 md:p-10 space-y-4">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-1">
            Audit Log
          </h1>
          <p className="text-sm text-stone-500">
            Every admin action is recorded here. Logs are kept for 90 days.
          </p>
        </div>
        {/* Entry count */}
        <div className="shrink-0 mt-1 px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-full text-xs font-semibold text-stone-600">
          {filteredLogs.length} {filter !== "all" ? "filtered" : "entries"}
        </div>
      </div>

      {/* ── Filter tabs — horizontal scroll on mobile ────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((f) => {
          const count = f.key === "all"
            ? logs.length
            : logs.filter((l) => l.action.startsWith(f.key)).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filter === f.key
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              <span>{f.icon}</span>
              {f.label}
              {count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === f.key ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Log list ──────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Loading audit log…" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📜</div>
            <p className="text-stone-600 font-medium">No entries found</p>
            <p className="text-xs text-stone-400 mt-1">
              {filter === "all"
                ? "Admin actions will appear here as they happen."
                : `No ${filter} actions recorded yet.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {filteredLogs.map((log) => (
              <AuditRow key={log._id} log={log} />
            ))}
          </ul>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            Page <span className="font-medium text-stone-700">{pagination.page}</span> of{" "}
            <span className="font-medium text-stone-700">{pagination.totalPages}</span>
            {" "}· {pagination.total} total entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-stone-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-stone-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition"
            >
              Next
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Single audit row ─────────────────────────────────────────────── */
function AuditRow({ log }) {
  const meta   = ACTIONS[log.action] || { label: log.action, color: "stone", icon: "•", group: "other" };
  const c      = COLOR[meta.color] || COLOR.stone;
  const when   = new Date(log.createdAt);
  const rel    = relativeTime(when);
  const abs    = when.toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  const actorInitials = (log.actor?.name || "?")
    .split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  // Best available detail string
  const detail = log.details?.email
    || log.details?.name
    || log.details?.label
    || log.details?.text
    || log.details?.key
    || "";

  // Secondary detail (e.g. role added/removed)
  const secondary = log.details?.role
    ? `Role: ${log.details.role}`
    : log.details?.value != null
      ? `Value: ${log.details.value}`
      : "";

  return (
    <li className={`border-l-4 ${c.border} hover:bg-stone-50/60 transition`}>
      <div className="flex items-start gap-3 px-4 py-3.5 md:px-5 md:py-4">

        {/* Actor avatar */}
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5">
          {actorInitials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Row 1: actor name + action badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-stone-900 leading-tight">
              {log.actor?.name || "Unknown admin"}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
              <span className="font-mono leading-none">{meta.icon}</span>
              {meta.label}
            </span>
          </div>

          {/* Row 2: detail */}
          {detail && (
            <p className="text-xs text-stone-500 truncate leading-snug">
              {detail}
              {secondary && (
                <span className="text-stone-400 ml-1.5">· {secondary}</span>
              )}
            </p>
          )}

          {/* Row 3: mobile timestamp (shown below on small screens) */}
          <p className="text-[10px] text-stone-400 mt-1 md:hidden" title={abs}>
            {rel} · {abs}
          </p>
        </div>

        {/* Timestamp — right side, desktop only */}
        <div className="hidden md:flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
          <span className="text-xs font-medium text-stone-500" title={abs}>
            {rel}
          </span>
          <span className="text-[10px] text-stone-400">{abs}</span>
        </div>
      </div>
    </li>
  );
}

export default Audit;