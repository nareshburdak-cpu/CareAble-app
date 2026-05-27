// client/src/pages/EmployerDashboard.jsx

/**
 * EmployerDashboard
 * -----------------
 * Authenticated employer view for verifying CareAble certificates.
 *
 * - Uses GET /api/verify/employer/:id (authenticated via axios)
 * - Admins who visit get the /admin/ endpoint with richer data
 * - Session history: in-memory list, resets on page refresh
 * - Design: indigo palette, distinct in-app panel feel
 */

import { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";

// ── helpers ────────────────────────────────────────────────────────────────

const CERT_ID_PATTERN = /^CA-[A-Z0-9]{2,12}(-[A-Z0-9]{2,12}){0,3}$/i;

const LEVEL_META = {
  Strength: {
    colour: "emerald",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    label: "High demonstrated capability",
  },
  Growth: {
    colour: "amber",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
    label: "Developing competency",
  },
  Support: {
    colour: "rose",
    bg: "bg-rose-50",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-800",
    dot: "bg-rose-500",
    label: "Targeted learning recommended",
  },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDuration(ms) {
  if (!ms) return null;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function ScoreBar({ score }) {
  const pct = Math.round(((score - 1) / 4) * 100);
  const colour =
    score >= 4.0
      ? "bg-emerald-500"
      : score >= 3.0
      ? "bg-amber-400"
      : "bg-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colour} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-500 w-8 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export default function EmployerDashboard() {
  const { hasRole, user } = useAuth();
  const isAdmin = hasRole("admin");

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // current lookup result
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]); // session history
  const inputRef = useRef(null);

  const endpoint = isAdmin ? "/verify/admin" : "/verify/employer";

  const handleVerify = async () => {
    const certId = inputValue.trim().toUpperCase();

    if (!certId) {
      setError("Please enter a certificate ID.");
      inputRef.current?.focus();
      return;
    }
    if (!CERT_ID_PATTERN.test(certId)) {
      setError("Invalid format. Certificate IDs look like CA-2026-FNVX9W.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await api.get(`${endpoint}/${encodeURIComponent(certId)}`);
      const data = res.data.data;
      setResult({ ...data, _lookupTime: new Date() });

      // Prepend to session history (dedupe by certificateId)
      setHistory((prev) => {
        const filtered = prev.filter(
          (h) => h.certificateId !== data.certificateId
        );
        return [{ ...data, _lookupTime: new Date() }, ...filtered].slice(0, 20);
      });
    } catch (err) {
      if (err.status === 404) {
        setError("No certificate found with that ID.");
      } else if (err.status === 410) {
        setError("This certificate has been revoked.");
      } else {
        setError(err.message || "Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleVerify();
  };

  const handleHistoryClick = (item) => {
    setInputValue(item.certificateId);
    setResult(item);
    setError("");
  };

  const handleClear = () => {
    setInputValue("");
    setResult(null);
    setError("");
    inputRef.current?.focus();
  };

  const levelMeta = result ? LEVEL_META[result.level] ?? LEVEL_META.Growth : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {isAdmin ? "Admin" : "Employer"} Portal
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Certificate Verification
              </h1>
              <p className="mt-1 text-base text-gray-500">
                Verify the authenticity of a CareAble caregiver certificate by entering its ID below.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end text-right">
              <p className="text-base font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column: search + result ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Search card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <label
                htmlFor="cert-input"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                Certificate ID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="cert-input"
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value.toUpperCase());
                      if (error) setError("");
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="CA-2026-XXXXXX"
                    className={`w-full px-4 py-2.5 rounded-lg border font-mono text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      transition ${
                        error
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 bg-white"
                      }`}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {inputValue && (
                    <button
                      onClick={handleClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      aria-label="Clear"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg
                    hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed
                    transition shadow-sm flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Verifying…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verify
                    </>
                  )}
                </button>
              </div>

              {error && (
                <p className="mt-2.5 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}

                <p className="mt-3 text-sm text-gray-400">
                Format: <span className="font-mono">CA-YYYY-XXXXXX</span> — found on the printed or downloaded certificate.
              </p>
            </div>

            {/* Result card */}
            {result && levelMeta && (
              <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${levelMeta.border}`}>
                {/* Verified banner */}
                <div className={`${levelMeta.bg} px-6 py-4 border-b ${levelMeta.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Certificate Verified</p>
                      <p className="text-xs text-gray-500">
                        Looked up {result._lookupTime?.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelMeta.badge}`}>
                    {result.level}
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {/* Core identity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoField label="Carer Name" value={result.name} large />
                    <InfoField
                      label="Overall Score"
                      value={
                        result.overallScore != null
                          ? `${result.overallScore.toFixed(2)} / 5.00`
                          : "—"
                      }
                      large
                    />
                    <InfoField label="Certificate ID" value={result.certificateId} mono />
                    <InfoField label="Issued" value={formatDate(result.issuedAt)} />
                    {result.completionTimeMs && (
                      <InfoField label="Completion Time" value={formatDuration(result.completionTimeMs)} />
                    )}
                    <InfoField label="Issuer" value={result.issuer} />
                  </div>

                  {/* Admin-only fields */}
                  {isAdmin && (
                    <div className="pt-4 border-t border-dashed border-gray-200">
                      <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
                        Admin Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField label="Email" value={result.email} />
                        <InfoField label="User ID" value={result.userId} mono small />
                        <InfoField label="Assessment ID" value={result.assessmentId} mono small />
                        <InfoField
                          label="Account Created"
                          value={formatDate(result.accountCreatedAt)}
                        />
                        <InfoField
                          label="Roles"
                          value={result.roles?.join(", ") ?? "—"}
                        />
                        {result.avgSecPerQuestion != null && (
                          <InfoField
                            label="Avg. Sec / Question"
                            value={`${result.avgSecPerQuestion.toFixed(1)}s`}
                          />
                        )}
                        {result.rushed && (
                          <div className="sm:col-span-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                              ⚠️ Flagged as rushed submission
                            </span>
                          </div>
                        )}
                        {result.isRevoked && (
                          <div className="sm:col-span-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              🚫 Account deactivated — certificate revoked
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Top areas */}
                  {result.topAreas?.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Top Capability Areas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.topAreas.map((area) => (
                          <span
                            key={area}
                            className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Domain score breakdown */}
                  {result.domainScores &&
                    Object.keys(result.domainScores).length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Domain Scores
                        </p>
                        <div className="space-y-2.5">
                          {Object.entries(result.domainScores)
                            .sort(([, a], [, b]) => b - a)
                            .map(([label, score]) => (
                              <div key={label}>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-gray-600 truncate pr-2">
                                    {label}
                                  </span>
                                </div>
                                <ScoreBar score={score} />
                              </div>
                            ))}
                        </div>
                        <p className="mt-3 text-sm text-gray-400">
                          Scores on a 1–5 scale. Strength ≥ 4.0 · Growth ≥ 3.0 · Support &lt; 3.0
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: session history ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">
                  Session History
                </h2>
                {history.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {history.length} verified
                  </span>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400">
                    Certificates you verify this session will appear here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {history.map((item) => {
                    const meta = LEVEL_META[item.level] ?? LEVEL_META.Growth;
                    const isCurrent = result?.certificateId === item.certificateId;
                    return (
                      <li key={item.certificateId}>
                        <button
                          onClick={() => handleHistoryClick(item)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border transition
                            ${
                              isCurrent
                                ? "bg-indigo-50 border-indigo-200"
                                : "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs font-mono text-gray-400 truncate">
                                {item.certificateId}
                              </p>
                            </div>
                            <span
                              className={`flex-shrink-0 w-2 h-2 rounded-full ${meta.dot}`}
                              title={item.level}
                            />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Legend */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Level Guide
              </p>
              <dl className="space-y-2">
                {Object.entries(LEVEL_META).map(([level, meta]) => (
                  <div key={level} className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${meta.dot}`} />
                    <div>
                      <dt className="text-sm font-semibold text-gray-700">{level}</dt>
                      <dd className="text-sm text-gray-400">{meta.label}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── small helper component ─────────────────────────────────────────────────
function InfoField({ label, value, large, mono, small }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-wider text-gray-400 font-medium mb-0.5">
        {label}
      </p>
      <p
        className={`text-gray-900 break-all ${
          large ? "text-base font-semibold" : "text-sm"
        } ${mono ? "font-mono" : ""} ${small ? "text-sm" : ""}`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
