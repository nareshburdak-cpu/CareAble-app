/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "../../utils/toast";
import LoadingSpinner from "../../components/LoadingSpinner";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "in-progress", label: "In Progress" },
];

const LEVEL_COLORS = {
  Strength: "border border-emerald-200 bg-emerald-100 text-emerald-700",
  Growth: "border border-indigo-200 bg-indigo-100 text-indigo-700",
  Support: "border border-amber-200 bg-amber-100 text-amber-700",
};

function Assessments() {
  const [assessments, setAssessments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

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
        params: { page, limit: 15, search: debouncedSearch, filter },
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
    <div className="mx-auto max-w-[1360px] space-y-4 p-4 md:p-8 xl:p-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-serif text-2xl font-bold text-stone-900 md:text-3xl">Assessments</h1>
          <p className="text-sm text-stone-500">
            Search, filter, and inspect carer assessment results.
          </p>
        </div>

        <div className="mt-1 shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
          {pagination.total} total
        </div>
      </div>

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by carer name or email..."
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === f.key
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                : "border border-stone-200 bg-white text-stone-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Loading assessments..." />
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-2">No data</div>
            <p className="text-stone-500">No assessments found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium md:px-6">Carer</th>
                <th className="px-3 py-3 text-left font-medium md:px-6">Status</th>
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

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            Page <span className="font-medium text-stone-700">{pagination.page}</span> of{" "}
            <span className="font-medium text-stone-700">{pagination.totalPages}</span> · {pagination.total} total assessments
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selected && (
        <AssessmentDrawer
          assessment={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function AssessmentRow({ assessment, onView }) {
  const a = assessment;
  const name = a.user?.name || "Unknown";
  const email = a.user?.email || "-";

  const initials = name
    .split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const date = a.submittedAt
    ? new Date(a.submittedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    : new Date(a.updatedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  return (
    <tr className="hover:bg-stone-50 transition cursor-pointer" onClick={onView}>
      <td className="px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-stone-900">{name}</p>
            <p className="truncate text-xs text-stone-500">{email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-4 md:px-6">
        <StatusBadge status={a.status} />
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <span className="text-sm font-semibold text-stone-900">
          {a.overallScore != null ? `${a.overallScore.toFixed(2)} / 5` : "-"}
        </span>
      </td>
      <td className="px-6 py-4 hidden lg:table-cell">
        {a.level ? (
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[a.level] || "border border-stone-200 bg-stone-100 text-stone-600"}`}>
            {a.level}
          </span>
        ) : (
          <span className="text-xs text-stone-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-stone-500 hidden md:table-cell">
        {date}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 hover:text-stone-900"
        >
          View
          <svg className="h-4 w-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

function StatusBadge({ status }) {
  if (status === "submitted") {
    return <span className="inline-block whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Submitted</span>;
  }
  if (status === "in-progress") {
    return <span className="inline-block whitespace-nowrap rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">In progress</span>;
  }
  return <span className="inline-block whitespace-nowrap rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">{status}</span>;
}

function AssessmentDrawer({ assessment, onClose }) {
  const a = assessment;
  const name = a.user?.name || "Unknown";
  const email = a.user?.email || "-";

  const submitted = a.submittedAt
    ? new Date(a.submittedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const started = new Date(a.createdAt).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  });

  const domainEntries = a.categoryScores
    ? Object.entries(a.categoryScores).sort((x, y) => y[1] - x[1])
    : [];

  const topAreas = domainEntries.filter(([, score]) => score >= 4.0).map(([key]) => key);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assessment-drawer-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h2 id="assessment-drawer-title" className="font-semibold text-stone-900">Assessment Detail</h2>
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

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
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

          <Section title="Summary">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox label="Status">
                <StatusBadge status={a.status} />
              </InfoBox>
              <InfoBox label="Overall Score">
                <span className="text-lg font-bold text-stone-900">
                  {a.overallScore != null ? `${a.overallScore.toFixed(2)} / 5` : "-"}
                </span>
              </InfoBox>
              <InfoBox label="Level">
                {a.level ? (
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${LEVEL_COLORS[a.level] || "bg-stone-100 text-stone-600"}`}>
                    {a.level}
                  </span>
                ) : "-"}
              </InfoBox>
              <InfoBox label="Certificate ID">
                <span className="text-xs font-mono text-stone-700">
                  {a.certificateId || "-"}
                </span>
              </InfoBox>
              <InfoBox label="Started">
                <span className="text-sm text-stone-700">{started}</span>
              </InfoBox>
              <InfoBox label="Submitted">
                <span className="text-sm text-stone-700">{submitted || "-"}</span>
              </InfoBox>
            </div>
          </Section>

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
                      Rushed
                    </span>
                  </InfoBox>
                )}
              </div>
            </Section>
          )}
        </div>

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

function InfoBox({ label, children }) {
  return (
    <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
      <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-1">{label}</p>
      <div>{children}</div>
    </div>
  );
}

export default Assessments;
