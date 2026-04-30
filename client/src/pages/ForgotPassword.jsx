/**
 * ForgotPassword — Public page for requesting a password reset link.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import toast from "../utils/toast";
import FormInput from "../components/FormInput";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || "Could not send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex-1 flex items-center justify-center bg-stone-50 p-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 max-w-md w-full">
        {!submitted ? (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-full mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-2">
                Forgot your password?
              </h1>
              <p className="text-sm text-stone-500">
                No worries — enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition shadow-sm"
              >
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                ← Back to log in
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              Check your email
            </h2>
            <p className="text-stone-600 leading-relaxed mb-6">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link to it. Check your inbox (and spam folder, just in case).
            </p>
            <p className="text-sm text-stone-500 mb-6">
              The link expires in 30 minutes.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 border-2 border-stone-200 text-stone-700 font-medium rounded-lg hover:border-indigo-300 hover:text-indigo-700 transition"
            >
              Back to log in
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default ForgotPassword;