/**
 * VerifyCertificate.jsx — Public Certificate Verification Page
 * -------------------------------------------------------------
 * Phase 14: Public-facing trust page reached by scanning the QR code
 * on a printed CareAble certificate.
 *
 * Route: /verify/:certificateId  (PUBLIC — no auth required)
 * API:   GET /api/verify/:certificateId  (public endpoint)
 *
 * This page renders inside the standard <Layout> (Navbar + Footer)
 * for brand consistency with the rest of the site.
 */

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

// API base URL — same logic your other pages use.
// In dev, Vite proxy forwards /api/* to localhost:5000.
// In production, VITE_API_URL points to careable-api.onrender.com.
const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Level → friendly description for visitors who don't know CareAble's framework
const LEVEL_DESCRIPTIONS = {
  Emerging: "Building foundational caregiving skills",
  Developing: "Growing confidence across caregiving areas",
  Confident: "Demonstrated capability across most caregiving areas",
  Advanced: "Highly experienced across all caregiving areas",
};

export default function VerifyCertificate() {
  const { certificateId } = useParams();

  // Three states: loading / success / error
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        // Public endpoint — no auth headers, no credentials needed
        const res = await fetch(`${API_BASE}/verify/${encodeURIComponent(certificateId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const json = await res.json();

        if (cancelled) return;

        if (res.ok && json?.success) {
          setData(json.data);
          setStatus("success");
        } else {
          // 404 ("not found") and 410 ("revoked") both land here
          setErrorMessage(
            res.status === 410
              ? "This certificate is no longer valid."
              : "We couldn't find a certificate with this ID."
          );
          setStatus("error");
        }
      } catch {
        if (cancelled) return;
        // Network failure, CORS issue, server down, etc.
        setErrorMessage("Unable to reach the verification service. Please try again later.");
        setStatus("error");
      }
    }

    verify();

    // Guard against React StrictMode double-mount in dev
    return () => {
      cancelled = true;
    };
  }, [certificateId]);

  // ============ LOADING ============
  if (status === "loading") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="mt-6 text-slate-600 text-sm">Verifying certificate…</p>
        </div>
      </div>
    );
  }

  // ============ ERROR ============
  if (status === "error") {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
          {/* Red X icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-9 h-9 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Certificate Not Verified
          </h1>
          <p className="mt-3 text-slate-600 max-w-md mx-auto">{errorMessage}</p>

          {certificateId && (
            <p className="mt-4 text-xs text-slate-400 font-mono">
              ID: {certificateId}
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100">
            <Link
              to="/"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Visit CareAble homepage →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============ SUCCESS ============
  const issuedDate = data?.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Top banner with verified state */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 px-6 sm:px-12 py-10 text-center border-b border-emerald-200">
          {/* Green check icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center ring-4 ring-emerald-200">
            <svg
              className="w-10 h-10 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Verified Authentic
          </div>

          <h1 className="mt-4 text-xl sm:text-2xl font-semibold text-slate-700">
            CareAble Certificate of Capability
          </h1>
        </div>

        {/* Body — credential details */}
        <div className="px-6 sm:px-12 py-10">
          {/* Recipient name */}
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
              Issued to
            </p>
            <p className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">
              {data.name}
            </p>
          </div>

          {/* Level — the prestige line */}
          <div className="bg-slate-50 rounded-xl p-6 text-center mb-8">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">
              Recognition Level
            </p>
            <p className="mt-2 text-2xl font-bold text-indigo-700">
              {data.level} Carer
            </p>
            {LEVEL_DESCRIPTIONS[data.level] && (
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                {LEVEL_DESCRIPTIONS[data.level]}
              </p>
            )}
          </div>

          {/* Metadata grid */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                Date of Issue
              </dt>
              <dd className="mt-1 text-slate-900 font-medium">{issuedDate}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                Certificate ID
              </dt>
              <dd className="mt-1 text-slate-900 font-mono text-xs sm:text-sm">
                {data.certificateId}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                Issued by
              </dt>
              <dd className="mt-1 text-slate-900 font-medium">{data.issuer}</dd>
            </div>
          </dl>
        </div>

        {/* Footer — anti-fraud note */}
        <div className="bg-slate-50 px-6 sm:px-12 py-6 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            This page confirms the authenticity of a CareAble certificate. Only certificates
            issued by CareAble can be verified through this service.
          </p>
        </div>
      </div>
    </div>
  );
}