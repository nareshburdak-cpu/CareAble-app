/**
 * VerifyEmail — Lands here from the email link.
 * Auto-submits the token + shows result.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState("loading");   // loading | success | already | error
  const [message, setMessage] = useState("");
  const hasVerified = useRef(false);

useEffect(() => {
  if (hasVerified.current) return;
  hasVerified.current = true;

  const verify = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Verification link is missing. Request a new one from your dashboard.");
      return;
    }

    try {
      const res = await api.post("/auth/verify-email", { token });

      if (res.data.data?.alreadyVerified) {
        setStatus("already");
        setMessage("Your email is already verified.");
      } else {
        setStatus("success");
        setMessage("Email verified! You can now generate certificates.");
      }

      if (refreshUser) await refreshUser();
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Verification failed. The link may have expired.");
    }
  };

  verify();
}, [token, refreshUser]);

  return (
    <section className="flex-1 flex items-center justify-center bg-stone-50 p-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-full mb-4">
              <svg className="w-6 h-6 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              Verifying your email...
            </h1>
            <p className="text-stone-500">Hang tight, this only takes a second.</p>
          </>
        )}

        {(status === "success" || status === "already") && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-2">
              {status === "success" ? "You're all set! 🎉" : "Already verified ✓"}
            </h1>
            <p className="text-stone-600 mb-6">{message}</p>
            <Link
              to="/dashboard"
              className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              Go to dashboard →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              Verification failed
            </h1>
            <p className="text-stone-600 mb-6">{message}</p>
            <Link
              to="/dashboard"
              className="inline-block px-6 py-2.5 border-2 border-stone-200 text-stone-700 font-medium rounded-lg hover:border-indigo-300 hover:text-indigo-700 transition"
            >
              Go to dashboard
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export default VerifyEmail;