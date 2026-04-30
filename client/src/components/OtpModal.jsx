/**
 * OtpModal — Reusable OTP verification modal
 * -------------------------------------------
 * Two-step flow:
 *   1. Send OTP (calls /auth/request-otp)
 *   2. User enters 6-digit code → /auth/verify-otp returns otpToken
 *   3. Parent calls onVerified(otpToken) to perform the actual action
 *
 * Usage:
 *   <OtpModal
 *     action="change-password"
 *     title="Confirm password change"
 *     onVerified={(otpToken) => doChangePassword(otpToken)}
 *     onClose={() => setShowOtp(false)}
 *   />
 */

import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import toast from "../utils/toast";

function OtpModal({ action, title, onVerified, onClose }) {
  const [step, setStep] = useState("sending");   // sending | enter | verifying
  const [otp, setOtp] = useState("");
  const inputRef = useRef(null);
  const hasSent = useRef(false);

  // Send OTP on open
  useEffect(() => {
    if (hasSent.current) return;
    hasSent.current = true;

    const send = async () => {
      try {
        await api.post("/auth/request-otp", { action });
        setStep("enter");
        // Focus the input after the step changes
        setTimeout(() => inputRef.current?.focus(), 100);
      } catch (err) {
        toast.error(err.message || "Could not send code");
        onClose();
      }
    };
    send();
  }, [action, onClose]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleVerify = async (e) => {
    e.preventDefault();

    const cleaned = otp.trim();
    if (cleaned.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setStep("verifying");
    try {
      const res = await api.post("/auth/verify-otp", {
        action,
        otp: cleaned,
      });
      onVerified(res.data.data.otpToken);
    } catch (err) {
      toast.error(err.message || "Invalid code");
      setStep("enter");
      setOtp("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/auth/request-otp", { action });
      toast.success("New code sent.");
      setOtp("");
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      toast.error(err.message || "Could not resend");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 pointer-events-auto animate-dropdown">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-full mb-4">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              {title}
            </h2>
            <p className="text-sm text-stone-500">
              For your security, we've sent a 6-digit code to your email.
            </p>
          </div>

          {step === "sending" && (
            <div className="text-center py-8">
              <svg className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-stone-500">Sending code...</p>
            </div>
          )}

          {(step === "enter" || step === "verifying") && (
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={step === "verifying"}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono font-bold tracking-[0.5em] py-4 border-2 border-stone-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:bg-stone-50"
                aria-label="6-digit verification code"
              />

              <button
                type="submit"
                disabled={step === "verifying" || otp.length !== 6}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition shadow-sm"
              >
                {step === "verifying" ? "Verifying..." : "Confirm"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-stone-500 hover:text-stone-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          <p className="text-xs text-stone-400 text-center mt-6">
            Code expires in 10 minutes. Up to 5 attempts allowed.
          </p>
        </div>
      </div>
    </>
  );
}

export default OtpModal;