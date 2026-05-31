// client/src/pages/EmployerDashboard.jsx

/**
 * EmployerDashboard — redesigned
 * ------------------------------
 * Authenticated employer workspace for verifying CareAble caregiver certificates.
 *
 * - Employer view: candidate-focused (name, masked email, level, scores). NO internal IDs.
 *   Email stays private — employers reach carers via brokered "Request to connect".
 * - Admin view: same + an "Admin details" block (real email, IDs, rushed flag).
 * - Saved candidates: last 5 lookups persisted locally via employerHistory.js,
 *   each markable Interested / Not interested. (Migrates to backend later.)
 * - Print report: client-side window.print() against a print-only layout.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import {
  getHistory,
  saveLookup,
  removeLookup,
} from "../utils/employerHistory";

// ── constants ────────────────────────────────────────────────────────────
const CERT_ID_PATTERN = /^CA-[A-Z0-9]{2,12}(-[A-Z0-9]{2,12}){0,3}$/i;

const LEVEL_META = {
  Strength: {
    badge: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    ring: "ring-emerald-200",
    glow: "from-emerald-500/10",
    label: "High demonstrated capability",
  },
  Growth: {
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
    bar: "bg-amber-400",
    ring: "ring-amber-200",
    glow: "from-amber-500/10",
    label: "Developing competency",
  },
  Support: {
    badge: "bg-rose-100 text-rose-800 ring-rose-200",
    dot: "bg-rose-500",
    bar: "bg-rose-400",
    ring: "ring-rose-200",
    glow: "from-rose-500/10",
    label: "Targeted learning recommended",
  },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatDuration(ms) {
  if (!ms) return null;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

// ── main ─────────────────────────────────────────────────────────────────
export default function EmployerDashboard() {
  const { hasRole, user } = useAuth();
  const isAdmin = hasRole("admin");

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  // Connect composer state
  const [showConnect, setShowConnect] = useState(false);
  const [connectMessage, setConnectMessage] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectSent, setConnectSent] = useState(false);
  const [connectError, setConnectError] = useState("");

  const inputRef = useRef(null);

  const endpoint = isAdmin ? "/verify/admin" : "/verify/employer";

  // Load persisted history on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const h = await getHistory();
      if (!cancelled) setHistory(h);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleVerify = useCallback(async () => {
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
      const enriched = { ...data, _lookupTime: new Date() };
      setResult(enriched);

      // Reset the connect composer for the new result
      setShowConnect(false);
      setConnectSent(false);
      setConnectMessage("");
      setConnectError("");

      // Persist the lean candidate summary, then refresh the panel
      const updated = await saveLookup({
        certificateId: data.certificateId,
        name: data.name,
        email: data.email ?? data.maskedEmail ?? null, // raw for admin, masked for employer
        level: data.level,
        overallScore: data.overallScore,
        issuedAt: data.issuedAt,
      });
      setHistory(updated);
    } catch (err) {
      if (err.status === 404) setError("No certificate found with that ID.");
      else if (err.status === 410) setError("This certificate has been revoked.");
      else setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [inputValue, endpoint]);

  const handleKeyDown = (e) => { if (e.key === "Enter") handleVerify(); };

  const handleClear = () => {
    setInputValue("");
    setResult(null);
    setError("");
    inputRef.current?.focus();
  };

  const handleHistoryClick = (item) => {
    setInputValue(item.certificateId);
    setError("");
    // Re-run a live verify so scores/admin data are fresh (cached entry is lean)
    setTimeout(() => handleVerify(), 0);
  };

  const handleRemove = async (certificateId) => {
    const updated = await removeLookup(certificateId);
    setHistory(updated);
  };

  const handlePrint = () => window.print();

const handleConnect = async () => {
    if (!result?.certificateId) return;
    setConnecting(true);
    setConnectError("");
    try {
      await api.post(
        `/verify/employer/${encodeURIComponent(result.certificateId)}/connect`,
        { message: connectMessage.trim() }
      );
      setConnectSent(true);
      setShowConnect(false);
      setConnectMessage("");
    } catch (err) {
      // Keep composer open and show the reason inline (amber notice)
      setConnectError(err.message || "Could not send your request. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const levelMeta = result ? LEVEL_META[result.level] ?? LEVEL_META.Growth : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 print:hidden">
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                {isAdmin ? "Admin" : "Employer"} Portal
              </span>
              <h1 className="mt-3 text-3xl font-bold text-white tracking-tight">
                Verify a caregiver certificate
              </h1>
              <p className="mt-1.5 text-indigo-100 max-w-xl">
                Confirm a CareAble certificate is authentic and review the carer&apos;s
                demonstrated capabilities — instantly.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm ring-1 ring-white/15">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
                {initials(user?.name)}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
                <p className="text-xs text-indigo-200">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: search + result */}
          <div className="lg:col-span-2 space-y-5">

            {/* Search card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 -mt-14 relative print:hidden">
              <label htmlFor="cert-input" className="block text-sm font-semibold text-slate-700 mb-3">
                Certificate ID
              </label>
              <div className="flex gap-2 items-stretch min-w-0">
                <div className="relative flex-1 min-w-0">
                  <input
                    id="cert-input"
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value.toUpperCase()); if (error) setError(""); }}
                    onKeyDown={handleKeyDown}
                    placeholder="CA-2026-XXXXXX"
                    className={`w-full px-4 py-3 rounded-xl border font-mono text-sm tracking-wide
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition
                      ${error ? "border-red-300 bg-red-50" : "border-slate-300 bg-white"}`}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {inputValue && (
                    <button onClick={handleClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      aria-label="Clear">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button onClick={handleVerify} disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl
                    hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed
                    transition shadow-sm flex items-center gap-2 whitespace-nowrap">
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
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}
              <p className="mt-3 text-sm text-slate-400">
                Format <span className="font-mono">CA-YYYY-XXXXXX</span> — printed on the carer&apos;s certificate.
              </p>
            </div>

            {/* Empty state */}
            {!result && !loading && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center print:hidden">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-700 font-medium">Enter a certificate ID to begin</p>
                <p className="text-sm text-slate-400 mt-1">
                  Verified results appear here and are saved to your candidates list.
                </p>
              </div>
            )}

            {/* Result card */}
            {result && levelMeta && (
              <div id="print-area"
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ring-1 ${levelMeta.ring}`}>
                {/* Banner */}
                <div className={`relative px-6 py-5 border-b border-slate-100 bg-gradient-to-r ${levelMeta.glow} to-transparent`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm ring-1 ring-emerald-200 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Certificate verified</p>
                        <p className="text-xs text-slate-500">
                          Checked {result._lookupTime?.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                          {" · "}CareAble
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ${levelMeta.badge}`}>
                      {result.level}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Candidate identity */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {initials(result.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-slate-900 truncate">{result.name}</h2>
                      {result.email ? (
                        <a href={`mailto:${result.email}`} className="text-sm text-indigo-600 hover:underline break-all">
                          {result.email}
                        </a>
                      ) : result.maskedEmail ? (
                        <span className="text-sm text-slate-500 break-all" title="Email hidden for privacy — use Request to connect">
                          {result.maskedEmail}
                        </span>
                      ) : null}
                      <p className="text-xs text-slate-400 font-mono mt-1">{result.certificateId}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Overall</p>
                      <p className="text-2xl font-bold text-slate-900 tabular-nums">
                        {result.overallScore != null ? result.overallScore.toFixed(2) : "—"}
                        <span className="text-sm font-medium text-slate-400"> / 5</span>
                      </p>
                    </div>
                  </div>

                  {/* Quick facts */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Fact label="Capability level" value={result.level} />
                    <Fact label="Issued" value={formatDate(result.issuedAt)} />
                    {result.completionTimeMs && (
                      <Fact label="Completion time" value={formatDuration(result.completionTimeMs)} />
                    )}
                  </div>

                  {/* Top areas */}
                  {result.topAreas?.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Top capability areas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.topAreas.map((area) => (
                          <span key={area}
                            className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium ring-1 ring-emerald-200">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Domain scores — capability matrix */}
                  {result.domainScores && Object.keys(result.domainScores).length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Capability breakdown
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Object.entries(result.domainScores)
                          .sort(([, a], [, b]) => b - a)
                          .map(([label, score]) => (
                            <DomainTile key={label} label={label} score={score} />
                          ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Strength ≥ 4.0
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" /> Growth ≥ 3.0
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-400" /> Support &lt; 3.0
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Admin-only block */}
                  {isAdmin && (
                    <div className="pt-4 border-t border-dashed border-slate-200 print:hidden">
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">
                        Admin details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Fact label="Email" value={result.email} />
                        <Fact label="User ID" value={result.userId} mono />
                        <Fact label="Assessment ID" value={result.assessmentId} mono />
                        <Fact label="Account created" value={formatDate(result.accountCreatedAt)} />
                        <Fact label="Roles" value={result.roles?.join(", ")} />
                        {result.avgSecPerQuestion != null && (
                          <Fact label="Avg sec / question" value={`${result.avgSecPerQuestion.toFixed(1)}s`} />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {result.rushed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            ⚠️ Flagged as rushed
                          </span>
                        )}
                        {result.isRevoked && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            🚫 Revoked — account deactivated
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 print:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                        </svg>
                        Print report
                      </button>
                      <button onClick={() => { setShowConnect((v) => !v); setConnectSent(false); setConnectError("");}}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                        Request to connect
                      </button>
                    </div>

                    {/* Connect composer */}
                    {showConnect && !connectSent && (
                      <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                        <p className="text-sm text-slate-600 mb-2">
                          We&apos;ll email <span className="font-medium">{result.name}</span> on your behalf.
                          Their address stays private — they can reply to you directly if interested.
                        </p>
                        <textarea
                          value={connectMessage}
                          onChange={(e) => setConnectMessage(e.target.value.slice(0, 500))}
                          rows={3}
                          placeholder="Optional message — e.g. the role or opportunity you have in mind."
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                        {connectError && (
                          <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            {connectError}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-400">{connectMessage.length}/500</span>
                          <div className="flex gap-2">
                            <button onClick={() => setShowConnect(false)}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition">
                              Cancel
                            </button>
                            <button onClick={handleConnect} disabled={connecting}
                              className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition">
                              {connecting ? "Sending…" : "Send request"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sent confirmation */}
                    {connectSent && (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-emerald-800">
                          Request sent. {result.name} will be in touch if they&apos;d like to connect.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: saved candidates */}
          <div className="space-y-4 print:hidden">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">Recently viewed</h2>
                {history.length > 0 && (
                  <span className="text-xs text-slate-400">{history.length} of 5</span>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-400">
                    Your 5 most recently verified profiles appear here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {history.map((item) => {
                    const meta = LEVEL_META[item.level] ?? LEVEL_META.Growth;
                    const isCurrent = result?.certificateId === item.certificateId;
                    return (
                      <li key={item.certificateId}
                        className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 transition ${
                          isCurrent ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100 hover:border-slate-200"
                        }`}>
                        {/* Level dot */}
                        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${meta.dot}`} title={item.level} />
                        {/* Clickable name + cert */}
                        <button onClick={() => handleHistoryClick(item)} className="flex-1 text-left min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{item.name}</p>
                          <p className="text-xs font-mono text-slate-400 truncate">{item.certificateId}</p>
                        </button>
                        {/* Remove */}
                        <button onClick={() => handleRemove(item.certificateId)}
                          className="flex-shrink-0 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                          aria-label="Remove">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>              )}
            </div>

            {/* Level guide */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Level guide</p>
              <dl className="space-y-2.5">
                {Object.entries(LEVEL_META).map(([level, meta]) => (
                  <div key={level} className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${meta.dot}`} />
                    <div>
                      <dt className="text-sm font-semibold text-slate-700">{level}</dt>
                      <dd className="text-xs text-slate-400">{meta.label}</dd>
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

// ── small fact component ───────────────────────────────────────────────────
function Fact({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-0.5">{label}</p>
      <p className={`text-sm text-slate-900 break-all ${mono ? "font-mono text-xs" : "font-medium"}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

// ── domain tile — segmented capability card ───────────────────────────────
function DomainTile({ label, score }) {
  const tier =
    score >= 4.0
      ? { text: "text-emerald-700", chip: "bg-emerald-100 text-emerald-700", fill: "bg-emerald-500" }
      : score >= 3.0
      ? { text: "text-amber-700", chip: "bg-amber-100 text-amber-700", fill: "bg-amber-400" }
      : { text: "text-rose-700", chip: "bg-rose-100 text-rose-700", fill: "bg-rose-400" };

  const segments = [1, 2, 3, 4, 5];

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:border-slate-200 hover:bg-white transition group">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="text-sm font-medium text-slate-700 capitalize leading-snug">
          {label.replace(/-/g, " ")}
        </p>
        <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${tier.chip}`}>
          {score.toFixed(1)}
        </span>
      </div>
      <div className="flex gap-1">
        {segments.map((seg) => {
          const filled = score >= seg;
          const partial = !filled && score > seg - 1;
          const pct = partial ? Math.round((score - (seg - 1)) * 100) : 0;
          return (
            <div key={seg} className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              {filled ? (
                <div className={`h-full w-full ${tier.fill} transition-all duration-700`} />
              ) : partial ? (
                <div
                  className={`h-full ${tier.fill} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}