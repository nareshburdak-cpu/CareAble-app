// client/src/pages/Login.jsx

/**
 * Login Page
 * ----------
 * Clean card design + features:
 *   - Google sign-in (top, fast path) — full-width, matches tab pill below
 *   - Password / Email-code (OTP) tabs
 *   - Role-aware redirect (admin > employer > carer)
 *
 * Aligned with Register:
 *   - Card padding: p-5 sm:p-8 md:p-10 (less cramped on mobile)
 *   - Section py-8 (consistent with register page)
 *   - Heading: text-xl sm:text-2xl
 *   - Tighter vertical rhythm on mobile
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import toast from "../utils/toast";
import { useAuth } from "../hooks/useAuth";
import FormInput from "../components/FormInput";

const LOGIN_OTP_RESEND_SECONDS = 60;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    requestLoginOtp,
    loginWithOtp,
    loginWithGoogle,
    roleDestination,
  } = useAuth();

  const from = location.state?.from || null;
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [mode, setMode] = useState("password"); // "password" | "otp"
  const [formData, setFormData] = useState({ email: "", password: "", otp: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  // ── ResizeObserver: keep Google button width === card content width ──
  const googleWrapperRef = useRef(null);
  const [googleWidth, setGoogleWidth] = useState(340);

  useEffect(() => {
    const el = googleWrapperRef.current;
    if (!el) return;
    setGoogleWidth(el.offsetWidth);
    const ro = new ResizeObserver(([entry]) => {
      setGoogleWidth(Math.floor(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── OTP countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  // ── Field handler ────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ── Validation ───────────────────────────────────────────────────
  const validateEmail = () => {
    const e = {};
    if (!formData.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "Please enter a valid email";
    }
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  };

  const validatePasswordLogin = () => {
    const e = {};
    if (!formData.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "Please enter a valid email";
    }
    if (!formData.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateOtpLogin = () => {
    const e = {};
    if (!formData.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "Please enter a valid email";
    }
    if (!formData.otp.trim()) {
      e.otp = "Code is required";
    } else if (!/^\d{6}$/.test(formData.otp.trim())) {
      e.otp = "Enter the 6-digit code";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Post-login redirect ──────────────────────────────────────────
  const completeLogin = (user) => {
    toast.success(`Welcome back, ${user.name.split(" ")[0]}! 👋`);

    if (!user.onboardingComplete && !user.roles?.includes("admin")) {
      navigate("/onboarding", { replace: true });
      return;
    }

    const restoredRole = localStorage.getItem("activeRole");
    const computedRole = user.roles?.includes(restoredRole)
      ? restoredRole
      : user.roles?.includes("admin")
      ? "admin"
      : user.roles?.includes("employer")
      ? "employer"
      : "carer";

    navigate(from || roleDestination(computedRole), { replace: true });
  };

  // ── Auth handlers ────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordLogin()) return;
    setIsSubmitting(true);
    try {
      const user = await login(formData.email.trim().toLowerCase(), formData.password);
      completeLogin(user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!validateEmail()) return;
    setIsSendingOtp(true);
    try {
      await requestLoginOtp(formData.email.trim().toLowerCase());
      setOtpSent(true);
      setResendSeconds(LOGIN_OTP_RESEND_SECONDS);
      toast.success("If your account exists, a login code has been sent to your email.");
    } catch (err) {
      const waitSeconds = err.extra?.rateLimit?.secondsRemaining;
      if (typeof waitSeconds === "number" && waitSeconds > 0) {
        setOtpSent(true);
        setResendSeconds(waitSeconds);
      }
      toast.error(err.message || "Could not send login code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!validateOtpLogin()) return;
    setIsSubmitting(true);
    try {
      const user = await loginWithOtp(
        formData.email.trim().toLowerCase(),
        formData.otp.trim()
      );
      completeLogin(user);
    } catch (err) {
      toast.error(err.message || "Could not log in with code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    if (!response.credential) {
      toast.error("Google sign-in did not return a valid credential.");
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await loginWithGoogle(response.credential);
      completeLogin(user);
    } catch (err) {
      if (err.extra?.code === "ACCOUNT_NOT_FOUND" || err.status === 404) {
        toast.error("No CareAble account exists for this Google email. Please sign up first.");
      } else {
        toast.error(err.message || "Could not continue with Google.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
    setOtpSent(false);
    setResendSeconds(0);
    setFormData((prev) => ({ ...prev, password: "", otp: "" }));
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <section className="flex-1 flex items-center justify-center p-4 py-8 bg-gray-50">
      {/* Card — matches Register padding exactly */}
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 md:p-10 max-w-md w-full">

        <img
          src="/logo-icon.png"
          alt=""
          className="w-12 h-12 object-contain mx-auto mb-3"
          aria-hidden="true"
        />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 text-center">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Log in to continue your journey.
        </p>

        {/* ── Google (fast path) ──────────────────────────────────
            ResizeObserver keeps this iframe width === card content.  */}
        <div ref={googleWrapperRef} className="w-full mb-4 overflow-hidden">
          {googleClientId ? (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google sign-in was cancelled or failed.")}
              text="continue_with"
              shape="pill"
              theme="outline"
              width={googleWidth}
            />
          ) : (
            <button
              type="button"
              disabled
              title="Add VITE_GOOGLE_CLIENT_ID to enable Google sign-in"
              className="w-full py-2.5 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-400 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 opacity-40" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Continue with Google
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase tracking-wide text-gray-400">or use email</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* ── Mode tabs ─────────────────────────────────────────── */}
        <div className="flex rounded-full bg-gray-100 p-1 mb-5">
          <button
            type="button"
            onClick={() => switchMode("password")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "password"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => switchMode("otp")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "otp"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Email code
          </button>
        </div>

        {/* ── Password form ─────────────────────────────────────── */}
        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} noValidate>
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <FormInput
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between -mt-2 mb-5 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Show password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition shadow-sm text-sm"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>

        ) : (
          /* ── OTP form ───────────────────────────────────────── */
          <form onSubmit={handleOtpSubmit} noValidate>
            <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-700">
              Receive a 6-digit sign-in code on your registered email. Resends are
              limited to keep your account safe.
            </div>

            <FormInput
              label="Registered email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={isSendingOtp || isSubmitting || resendSeconds > 0}
              className="w-full mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSendingOtp
                ? "Sending..."
                : resendSeconds > 0
                  ? `Resend in ${resendSeconds}s`
                  : otpSent
                    ? "Resend code"
                    : "Send code"}
            </button>

            <FormInput
              label="6-digit code"
              name="otp"
              type="text"
              value={formData.otp}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: "otp",
                    value: e.target.value.replace(/\D/g, "").slice(0, 6),
                  },
                })
              }
              error={errors.otp}
              placeholder="000000"
              autoComplete="one-time-code"
              helperText={
                otpSent
                  ? resendSeconds > 0
                    ? `Code sent. You can request another in ${resendSeconds}s.`
                    : "Enter the code sent to your registered email."
                  : "Send a code first, then enter it here."
              }
            />

            <button
              type="submit"
              disabled={isSubmitting || !otpSent}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition shadow-sm text-sm"
            >
              {isSubmitting ? "Verifying..." : "Log in with code"}
            </button>
          </form>
        )}

        <p className="mt-5 text-sm text-center text-gray-600">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
