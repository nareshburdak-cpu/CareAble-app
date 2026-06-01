/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "../../utils/toast";

const ACTIONS = {
  "user.verify": { label: "Force-verified email", color: "emerald", icon: "✓" },
  "user.unverify": { label: "Unverified email", color: "amber", icon: "!" },
  "user.promote": { label: "Promoted to admin", color: "purple", icon: "↑" },
  "user.demote": { label: "Demoted from admin", color: "stone", icon: "↓" },
  "user.deactivate": { label: "Deactivated account", color: "red", icon: "✕" },
  "user.reactivate": { label: "Reactivated account", color: "emerald", icon: "↺" },
  "user.addRole": { label: "Added role", color: "indigo", icon: "+" },
  "user.removeRole": { label: "Removed role", color: "amber", icon: "−" },
  "user.role.add": { label: "Added role", color: "indigo", icon: "+" },
  "user.role.remove": { label: "Removed role", color: "amber", icon: "−" },
  "question.create": { label: "Created question", color: "indigo", icon: "+" },
  "question.update": { label: "Updated question", color: "stone", icon: "✎" },
  "question.archive": { label: "Archived question", color: "amber", icon: "▽" },
  "question.restore": { label: "Restored question", color: "emerald", icon: "↺" },
  "question.reorder": { label: "Reordered questions", color: "indigo", icon: "⇅" },
  "category.create": { label: "Created domain", color: "indigo", icon: "+" },
  "category.update": { label: "Updated domain", color: "stone", icon: "✎" },
  "category.archive": { label: "Archived domain", color: "amber", icon: "▽" },
  "category.restore": { label: "Restored domain", color: "emerald", icon: "↺" },
  "category.reorder": { label: "Reordered domains", color: "indigo", icon: "⇅" },
  "setting.update": { label: "Updated setting", color: "indigo", icon: "⚙" },
};

const COLOR = {
  emerald: { badge: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-400", dot: "bg-emerald-400" },
  amber: { badge: "bg-amber-100 text-amber-700", border: "border-l-amber-400", dot: "bg-amber-400" },
  red: { badge: "bg-red-100 text-red-700", border: "border-l-red-400", dot: "bg-red-400" },
  purple: { badge: "bg-purple-100 text-purple-700", border: "border-l-purple-400", dot: "bg-purple-400" },
  indigo: { badge: "bg-indigo-100 text-indigo-700", border: "border-l-indigo-400", dot: "bg-indigo-400" },
  stone: { badge: "bg-stone-100 text-stone-600", border: "border-l-stone-300", dot: "bg-stone-300" },
};

const FILTERS = [
  { key: "all", label: "All", icon: "📋" },
  { key: "user", label: "Users", icon: "👤" },
  { key: "question", label: "Questions", icon: "❓" },
  { key: "category", label: "Domains", icon: "🗂️" },
  { key: "setting", label: "Settings", icon: "⚙️" },
];

function relativeTime(date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 10080) return `${Math.floor(mins / 1440)}d ago`;
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function Audit() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [counts, setCounts] = useState({ all: 0, user: 0, question: 0, category: 0, setting: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    try {
      const params = { page, limit: 15 };
      if (filter !== "all") params.group = filter;

      const res = await api.get("/admin/audit", { params });
      setLogs(res.data.data.logs);
      setPagination(res.data.data.pagination);
      setCounts(res.data.data.counts || { all: 0, user: 0, question: 0, category: 0, setting: 0 });
    } catch (err) {
      toast.error(err.message || "Could not load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="mx-auto max-w-[1360px] space-y-4 p-4 md:p-8 xl:p-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-serif text-2xl font-bold text-stone-900 md:text-3xl">Audit Log</h1>
          <p className="text-sm text-stone-500">Every admin action is recorded here. Logs are kept for 90 days.</p>
        </div>

        <div className="mt-1 shrink-0 rounded-full border border-stone-200 bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600">
          {pagination.total} entries
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((item) => {
          const count = counts[item.key] || 0;
          return (
            <button
              key={item.key}
              onClick={() => {
                setFilter(item.key);
                setPage(1);
              }}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === item.key
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  filter === item.key ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Loading audit log..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                />
              </svg>
            </div>
            <p className="font-medium text-stone-600">No entries found</p>
            <p className="mt-1 text-xs text-stone-400">
              {filter === "all" ? "Admin actions will appear here as they happen." : `No ${filter} actions recorded yet.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {logs.map((log) => (
              <AuditRow key={log._id} log={log} />
            ))}
          </ul>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            Page <span className="font-medium text-stone-700">{pagination.page}</span> of{" "}
            <span className="font-medium text-stone-700">{pagination.totalPages}</span> · {pagination.total} total entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              disabled={page === pagination.totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditRow({ log }) {
  const meta = ACTIONS[log.action] || { label: log.action, color: "stone", icon: "•" };
  const color = COLOR[meta.color] || COLOR.stone;
  const when = new Date(log.createdAt);
  const rel = relativeTime(when);
  const abs = when.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const actorInitials = (log.actor?.name || "?")
    .split(" ")
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const detail =
    log.details?.email || log.details?.name || log.details?.label || log.details?.text || log.details?.key || "";

  const secondary =
    log.details?.role ? `Role: ${log.details.role}` : log.details?.value != null ? `Value: ${log.details.value}` : "";

  return (
    <li className={`border-l-4 transition hover:bg-stone-50/60 ${color.border}`}>
      <div className="flex items-start gap-3 px-4 py-3.5 md:px-5 md:py-4">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white md:h-9 md:w-9">
          {actorInitials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold leading-tight text-stone-900">{log.actor?.name || "Unknown admin"}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color.badge}`}>
              <span className="font-mono leading-none">{meta.icon}</span>
              {meta.label}
            </span>
          </div>

          {detail && (
            <p className="truncate text-xs leading-snug text-stone-500">
              {detail}
              {secondary && <span className="ml-1.5 text-stone-400">· {secondary}</span>}
            </p>
          )}

          <p className="mt-1 text-xs text-stone-400 md:hidden" title={abs}>
            {rel} · {abs}
          </p>
        </div>

        <div className="ml-2 hidden flex-shrink-0 flex-col items-end gap-0.5 md:flex">
          <span className="text-xs font-medium text-stone-500" title={abs}>
            {rel}
          </span>
          <span className="text-xs text-stone-400">{abs}</span>
        </div>
      </div>
    </li>
  );
}

export default Audit;
