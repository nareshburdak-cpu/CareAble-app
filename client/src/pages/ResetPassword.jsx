/**
 * ResetPassword — Public page user lands on from email link.
 * Reads token from query string, asks for new password, posts to API.
 */

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import toast from "../utils/toast";
import FormInput from "../components/FormInput";
import { useAuth } from "../hooks/useAuth";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Reset link is missing. Please request a new one.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/reset-password", {
        token,
        newPassword,
      });

      // Auto-login with the returned token
      const { user, token: jwt } = res.data.data;
      login(user, jwt);

      toast.success("Password reset! You're now logged in.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Could not reset password");
      setSubmitting(false);
    }
  };

  // No token in URL — show error state
  if (!token) {
    return (
      <section className="flex-1 flex items-center justify-center bg-stone-50 p-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">
            Invalid reset link
          </h1>
          <p className="text-stone-600 mb-6">
            This link is missing or malformed. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Request new link
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex items-center justify-center bg-stone-50 p-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-full mb-4">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-2">
            Set a new password
          </h1>
          <p className="text-sm text-stone-500">
            Choose a strong password (at least 8 characters).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="New password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />

          <FormInput
            label="Confirm password"
            name="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition shadow-sm"
          >
            {submitting ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to log in
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ResetPassword;