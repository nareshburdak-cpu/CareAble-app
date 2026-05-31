/**
 * EmailVerifyBanner — Shown to logged-in users with unverified emails.
 * Appears at the top of all protected pages.
 */

import { useState } from "react";
import api from "../api/axios";
import toast from "../utils/toast";
import { useAuth } from "../hooks/useAuth";

function EmailVerifyBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const dismissalKey = user?.email ? `email-verify-banner-dismissed:${user.email}` : null;
  const [dismissedEmail, setDismissedEmail] = useState(null);
  const dismissed = !!dismissalKey && (
    dismissedEmail === user?.email ||
    sessionStorage.getItem(dismissalKey) === "true"
  );

  // Don't show if no user, already verified, or dismissed this session
  if (!user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent! Check your inbox.");
    } catch (err) {
      toast.error(err.message || "Could not resend. Try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-900">
            <strong>Verify your email</strong> to unlock certificate generation.
            Check your inbox or{" "}
            <button
              onClick={handleResend}
              disabled={sending}
              className="underline font-medium hover:text-amber-700 disabled:opacity-50 disabled:no-underline"
            >
              {sending ? "sending..." : "resend the link"}
            </button>
            .
          </p>
        </div>

        <button
          onClick={() => {
            if (dismissalKey) sessionStorage.setItem(dismissalKey, "true");
            setDismissedEmail(user.email);
          }}
          aria-label="Dismiss"
          className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-md p-1 transition flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default EmailVerifyBanner;
