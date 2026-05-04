/**
 * Admin: Audit Log
 * ----------------
 * Read-only list of every admin action performed.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";

// Friendly action labels + icons
const ACTIONS = {
  "user.verify":      { label: "Force-verified email",     color: "emerald" },
  "user.unverify":    { label: "Unverified email",         color: "amber" },
  "user.promote":     { label: "Promoted to admin",        color: "purple" },
  "user.demote":      { label: "Demoted to user",          color: "stone" },
  "user.deactivate":  { label: "Deactivated account",      color: "red" },
  "user.reactivate":  { label: "Reactivated account",      color: "emerald" },
  "question.create":  { label: "Created question",         color: "indigo" },
  "question.update":  { label: "Updated question",         color: "stone" },
  "question.archive": { label: "Archived question",        color: "amber" },
  "question.restore": { label: "Restored question",        color: "emerald" },
  "question.reorder": { label: "Reordered question",       color: "stone" },
};

const FILTERS = [
  { key: "all",      label: "All" },
  { key: "user",     label: "Users" },
  { key: "question", label: "Questions" },
];

function Audit() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/audit", {
        params: { page, limit: 50 },
      });
      setLogs(res.data.data.logs);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.message || "Could not load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter on the client (cheap with our limit of 50)
  const filteredLogs = filter === "all"
    ? logs
    : logs.filter((l) => l.action.startsWith(filter));

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
          Audit Log
        </h1>
        <p className="text-stone-600">
          Every admin action is recorded here. Logs are kept for 90 days.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1 p-1 bg-stone-100 rounded-lg w-fit mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filter === f.key
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Loading audit log..." />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-2">📜</div>
            <p className="text-stone-500">No audit entries yet.</p>
            <p className="text-xs text-stone-400 mt-1">
              Admin actions will be recorded here as they happen.
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Single audit row ----
function AuditRow({ log }) {
  const meta = ACTIONS[log.action] || { label: log.action, color: "stone" };
  const colors = {
    emerald: "bg-emerald-100 text-emerald-700",
    amber:   "bg-amber-100 text-amber-700",
    red:     "bg-red-100 text-red-700",
    purple:  "bg-purple-100 text-purple-700",
    indigo:  "bg-indigo-100 text-indigo-700",
    stone:   "bg-stone-100 text-stone-700",
  };

  const when = new Date(log.createdAt);
  const whenStr = when.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // Minutes ago for very recent
  const minutesAgo = Math.floor((Date.now() - when.getTime()) / 60000);
  const relativeStr = minutesAgo < 60
    ? `${minutesAgo === 0 ? "just now" : `${minutesAgo} min ago`}`
    : minutesAgo < 24 * 60
      ? `${Math.floor(minutesAgo / 60)} hr ago`
      : whenStr;

  const actorInitials = log.actor?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  // Build a friendly description from details
  const detailString = log.details?.email || log.details?.text || "";

  return (
    <li className="px-6 py-4 hover:bg-stone-50 transition">
      <div className="flex items-start gap-4">
        {/* Actor avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {actorInitials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-stone-900">
              {log.actor?.name || "Unknown admin"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[meta.color]}`}>
              {meta.label}
            </span>
          </div>
          {detailString && (
            <p className="text-sm text-stone-600 truncate">
              {detailString}
            </p>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-stone-400 flex-shrink-0" title={whenStr}>
          {relativeStr}
        </div>
      </div>
    </li>
  );
}

export default Audit;