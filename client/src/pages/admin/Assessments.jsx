// client/src/pages/admin/Assessments.jsx

/**
 * Admin: Assessments List
 * -----------------------
 * Paginated list of all carer assessments.
 * Search by carer name or email.
 * Filter by status (all / submitted / in-progress).
 * Click a row to open a detail drawer.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";

const FILTERS = [
  { key: "all",         label: "All"         },
  { key: "submitted",   label: "Submitted"   },
  { key: "in-progress", label: "In Progress" },
];

const LEVEL_COLORS = {
  Strength: "bg-emerald-100 text-emerald-700",
  Growth:   "bg-indigo-100 text-indigo-700",
  Support:  "bg-amber-100 text-amber-700",
};

function Assessments() {
  const [assessments, setAssessments]   = useState([]);
  const [pagination, setPagination]     = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter]             = useState("all");
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState(null); // full assessment object

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/assessments", {
        params: { page, limit: 20, search: debouncedSearch, filter },
      });
      setAssessments(res.data.data.assessments);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.message || "Could not load assessments");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filter]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
          Assessments
        </h1>
        <p className="text-stone-600">
          All carer skill assessments — search, filter, and inspect results.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by carer name or email..."
              className="w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-1 p-1 bg-stone-100 rounded-lg">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setPage(1); }}
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Loading assessments..." />
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-stone-500">No assessments found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-600">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Carer</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium hidden md:table-cell">Score</th>
                <th className="px-6 py-3 text-left font-medium hidden lg:table-cell">Level</th>
                <th className="px-6 py-3 text-left font-medium hidden md:table-cell">Date</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {assessments.map((a) => (
                <AssessmentRow
                  key={a._id}
                  assessment={a}
                  onView={() => setSelected(a)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} assessments)
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

      {/* Detail drawer */}
      {selected && (
        <AssessmentDrawer
          assessment={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── Table row ──────────────────────────────────────────────────────
function AssessmentRow({ assessment, onView }) {
  const a = assessment;
  const name  = a.user?.name  || "Unknown";
  const email = a.user?.email || "—";

  const initials = name
    .split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const date = a.submittedAt
    ? new Date(a.submittedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    : new Date(a.updatedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  return (
    <tr className="hover:bg-stone-50 transition cursor-pointer" onClick={onView}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">{name}</p>
            <p className="text-xs text-stone-500 truncate">{email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={a.status} />
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <span className="text-sm font-semibold text-stone-900">
          {a.overallScore != null ? `${a.overallScore.toFixed(2)} / 5` : "—"}
        </span>
      </td>
      <td className="px-6 py-4 hidden lg:table-cell">
        {a.level ? (
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${LEVEL_COLORS[a.level] || "bg-stone-100 text-stone-600"}`}>
            {a.level}
          </span>
        ) : (
          <span className="text-xs text-stone-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-stone-500 hidden md:table-cell">
        {date}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View →
        </button>
      </td>
    </tr>
  );
}

// ── Status badge ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === "submitted") {
    return <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">Submitted</span>;
  }
  if (status === "in-progress") {
    return <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">In Progress</span>;
  }
  return <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-stone-100 text-stone-600">{status}</span>;
}

// ── Detail drawer ──────────────────────────────────────────────────
function AssessmentDrawer({ assessment, onClose }) {
  const a = assessment;
  const name  = a.user?.name  || "Unknown";
  const email = a.user?.email || "—";

  const submitted = a.submittedAt
    ? new Date(a.submittedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const started = new Date(a.createdAt).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  });

  // Domain scores — categoryScores is a plain object after lean()
  const domainEntries = a.categoryScores
    ? Object.entries(a.categoryScores).sort((x, y) => y[1] - x[1])
    : [];

  const topAreas = domainEntries.filter(([, score]) => score >= 4.0).map(([key]) => key);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h2 className="font-semibold text-stone-900">Assessment Detail</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              ID: {a.certificateId || a._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-200 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Carer info */}
          <Section title="Carer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-stone-900">{name}</p>
                <p className="text-sm text-stone-500">{email}</p>
              </div>
            </div>
          </Section>

          {/* Summary */}
          <Section title="Summary">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox label="Status">
                <StatusBadge status={a.status} />
              </InfoBox>
              <InfoBox label="Overall Score">
                <span className="text-lg font-bold text-stone-900">
                  {a.overallScore != null ? `${a.overallScore.toFixed(2)} / 5` : "—"}
                </span>
              </InfoBox>
              <InfoBox label="Level">
                {a.level ? (
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${LEVEL_COLORS[a.level] || "bg-stone-100 text-stone-600"}`}>
                    {a.level}
                  </span>
                ) : "—"}
              </InfoBox>
              <InfoBox label="Certificate ID">
                <span className="text-xs font-mono text-stone-700">
                  {a.certificateId || "—"}
                </span>
              </InfoBox>
              <InfoBox label="Started">
                <span className="text-sm text-stone-700">{started}</span>
              </InfoBox>
              <InfoBox label="Submitted">
                <span className="text-sm text-stone-700">{submitted || "—"}</span>
              </InfoBox>
            </div>
          </Section>

          {/* Top capability areas */}
          {topAreas.length > 0 && (
            <Section title="Top Capability Areas">
              <div className="flex flex-wrap gap-2">
                {topAreas.map((key) => (
                  <span key={key} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                    {key}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Domain scores */}
          {domainEntries.length > 0 && (
            <Section title="Domain Scores">
              <div className="space-y-2.5">
                {domainEntries.map(([key, score]) => {
                  const pct = ((score - 1) / 4) * 100;
                  const color = score >= 4.0 ? "bg-emerald-500" : score >= 3.0 ? "bg-indigo-500" : "bg-amber-500";
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-stone-700 truncate pr-2">{key}</span>
                        <span className="text-xs font-bold text-stone-900 flex-shrink-0">{score.toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Timing info */}
          {(a.completionTimeMs || a.rushed) && (
            <Section title="Timing">
              <div className="grid grid-cols-2 gap-3">
                {a.completionTimeMs && (
                  <InfoBox label="Completion time">
                    <span className="text-sm text-stone-700">
                      {Math.round(a.completionTimeMs / 60000)} min
                    </span>
                  </InfoBox>
                )}
                {a.rushed && (
                  <InfoBox label="Flagged">
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Rushed ⚠️
                    </span>
                  </InfoBox>
                )}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-stone-200 text-stone-700 text-sm font-medium rounded-xl hover:bg-stone-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Reusable section wrapper ───────────────────────────────────────
function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Info box ───────────────────────────────────────────────────────
function InfoBox({ label, children }) {
  return (
    <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
      <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-1">{label}</p>
      <div>{children}</div>
    </div>
  );
}

export default Assessments;