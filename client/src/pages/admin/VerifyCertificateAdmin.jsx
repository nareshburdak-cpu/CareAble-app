// client/src/pages/admin/VerifyCertificateAdmin.jsx

/**
 * Admin: Certificate Verification
 * --------------------------------
 * Admins can verify any certificate by ID.
 * Uses the authenticated admin endpoint which returns full data
 * including user email, userId, assessment ID, and rushed flag.
 *
 * GET /api/verify/admin/:certificateId
 */

import { useState } from "react";
import api from "../../api/axios";

const CERT_PATTERN = /^CA-[A-Z0-9]{2,12}(-[A-Z0-9]{2,12}){0,3}$/i;

const LEVEL_COLORS = {
  Strength: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Growth:   "bg-indigo-100 text-indigo-700 border-indigo-200",
  Support:  "bg-amber-100 text-amber-700 border-amber-200",
};

export default function VerifyCertificateAdmin() {
  const [input, setInput]       = useState("");
  const [status, setStatus]     = useState("idle"); // idle | loading | found | invalid | revoked | error
  const [result, setResult]     = useState(null);
  const [history, setHistory]   = useState([]); // session search history

  const handleVerify = async (certId) => {
    const id = (certId || input).trim().toUpperCase();

    if (!id) return;

    if (!CERT_PATTERN.test(id)) {
      setStatus("invalid");
      setResult(null);
      return;
    }

    setStatus("loading");
    setResult(null);

    try {
      const res = await api.get(`/verify/admin/${id}`);
      const data = res.data.data;

      setResult(data);
      setStatus(data.isRevoked ? "revoked" : "found");

      // Add to session history (most recent first, no duplicates)
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.certificateId !== data.certificateId);
        return [{ ...data, searchedAt: new Date() }, ...filtered].slice(0, 10);
      });
    } catch (err) {
      if (err.status === 404) {
        setStatus("not-found");
      } else if (err.status === 410) {
        setStatus("revoked");
      } else {
        setStatus("error");
      }
      setResult(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify(input);
  };

  const handleReset = () => {
    setInput("");
    setStatus("idle");
    setResult(null);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
          Verify Certificate
        </h1>
        <p className="text-stone-600">
          Look up any CareAble certificate by ID. Admin view shows full details including user and assessment data.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value.toUpperCase());
                if (status !== "idle") setStatus("idle");
              }}
              placeholder="e.g. CA-2026-FNVX9W"
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={status === "loading" || !input.trim()}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition"
            >
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking…
                </span>
              ) : "Verify"}
            </button>
            {status !== "idle" && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 border border-stone-200 text-stone-600 text-sm font-medium rounded-xl hover:bg-stone-50 transition"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        <p className="text-xs text-stone-400 mt-3">
          Format: <span className="font-mono">CA-YYYY-XXXXXX</span> — case insensitive
        </p>
      </div>

      {/* Result */}
      {status === "invalid" && (
        <StatusCard
          icon="❌"
          title="Invalid format"
          message="Certificate IDs must follow the format CA-YYYY-XXXXXX (e.g. CA-2026-FNVX9W)."
          color="red"
        />
      )}

      {status === "not-found" && (
        <StatusCard
          icon="🔍"
          title="Not found"
          message="No certificate exists with that ID. Check the ID and try again."
          color="amber"
        />
      )}

      {status === "error" && (
        <StatusCard
          icon="⚠️"
          title="Something went wrong"
          message="Could not complete the verification. Please try again."
          color="red"
        />
      )}

      {(status === "found" || status === "revoked") && result && (
        <ResultCard result={result} />
      )}

      {/* Session history */}
      {history.length > 0 && status === "idle" && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Recent searches this session
          </p>
          <div className="space-y-2">
            {history.map((h) => (
              <button
                key={h.certificateId}
                onClick={() => {
                  setInput(h.certificateId);
                  handleVerify(h.certificateId);
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-stone-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-stone-800">{h.certificateId}</span>
                  <span className="text-sm text-stone-500">{h.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {h.isRevoked ? (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Revoked</span>
                  ) : (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LEVEL_COLORS[h.level] || "bg-stone-100 text-stone-600"}`}>
                      {h.level}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Result card ────────────────────────────────────────────────────
function ResultCard({ result }) {
  const isRevoked = result.isRevoked;

  const domainEntries = result.domainScores
    ? Object.entries(result.domainScores).sort((a, b) => b[1] - a[1])
    : [];

  const issuedAt = result.issuedAt
    ? new Date(result.issuedAt).toLocaleDateString("en-AU", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  return (
    <div className={`bg-white border-2 rounded-2xl overflow-hidden ${
      isRevoked ? "border-red-200" : "border-emerald-200"
    }`}>

      {/* Status banner */}
      <div className={`px-6 py-3 flex items-center gap-2 ${
        isRevoked ? "bg-red-50" : "bg-emerald-50"
      }`}>
        <svg
          className={`w-5 h-5 ${isRevoked ? "text-red-500" : "text-emerald-500"}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
        >
          {isRevoked ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
        <span className={`text-sm font-semibold ${isRevoked ? "text-red-700" : "text-emerald-700"}`}>
          {isRevoked ? "Certificate Revoked" : "Certificate Verified"}
        </span>
        <span className="ml-auto font-mono text-xs text-stone-500">{result.certificateId}</span>
      </div>

      <div className="p-6 space-y-5">

        {/* Carer + level */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-stone-900">{result.name}</p>
            <p className="text-sm text-stone-500">{result.email}</p>
            <p className="text-xs text-stone-400 mt-1">Issued {issuedAt}</p>
          </div>
          {result.level && (
            <span className={`flex-shrink-0 px-3 py-1.5 text-sm font-semibold rounded-xl border ${LEVEL_COLORS[result.level] || "bg-stone-100 text-stone-600"}`}>
              {result.level}
            </span>
          )}
        </div>

        {/* Admin-only fields */}
        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="Overall Score">
            <span className="text-lg font-bold text-stone-900">
              {result.overallScore != null ? `${result.overallScore.toFixed(2)} / 5` : "—"}
            </span>
          </InfoBox>
          <InfoBox label="Assessment ID">
            <span className="text-xs font-mono text-stone-600 break-all">
              {result.assessmentId || "—"}
            </span>
          </InfoBox>
          <InfoBox label="User ID">
            <span className="text-xs font-mono text-stone-600 break-all">
              {result.userId || "—"}
            </span>
          </InfoBox>
          <InfoBox label="Account Created">
            <span className="text-xs text-stone-700">
              {result.accountCreatedAt
                ? new Date(result.accountCreatedAt).toLocaleDateString("en-AU")
                : "—"}
            </span>
          </InfoBox>
          {result.completionTimeMs && (
            <InfoBox label="Completion Time">
              <span className="text-sm text-stone-700">
                {Math.round(result.completionTimeMs / 60000)} min
              </span>
            </InfoBox>
          )}
          {result.rushed && (
            <InfoBox label="Flag">
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Rushed ⚠️
              </span>
            </InfoBox>
          )}
        </div>

        {/* Top areas */}
        {result.topAreas?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Top Capability Areas
            </p>
            <div className="flex flex-wrap gap-2">
              {result.topAreas.map((area) => (
                <span key={area} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Domain scores */}
        {domainEntries.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
              Domain Scores
            </p>
            <div className="space-y-2.5">
              {domainEntries.map(([domain, score]) => {
                const pct = ((score - 1) / 4) * 100;
                const barColor = score >= 4.0 ? "bg-emerald-500" : score >= 3.0 ? "bg-indigo-500" : "bg-amber-500";
                return (
                  <div key={domain}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-stone-700 truncate pr-2">{domain}</span>
                      <span className="text-xs font-bold text-stone-900 flex-shrink-0">{score.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status card (error / not found / invalid) ──────────────────────
function StatusCard({ icon, title, message, color }) {
  const colors = {
    red:   "bg-red-50 border-red-200 text-red-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
  };
  return (
    <div className={`border rounded-2xl p-5 flex items-start gap-4 ${colors[color]}`}>
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div>
        <p className="font-semibold mb-0.5">{title}</p>
        <p className="text-sm opacity-80">{message}</p>
      </div>
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