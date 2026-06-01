// client/src/pages/Register.jsx

/**
 * Register Page — Phase 12-B
 * --------------------------
 * Two-step signup flow:
 *   Step 1 — Welcome + role selection (carer / employer / both)
 *   Step 2 — Choose signup method:
 *              • Two method pills: "Sign up with Google" / "Sign up with email"
 *              • Terms + Consent sit under pills (always visible for Google path)
 *              • Email → fields expand as accordion (collapse on re-click)
 *
 * Mobile fixes:
 *   ✓ Reduced card padding on mobile (p-5 → md:p-8) — less congestion
 *   ✓ Single name toggle collapses grid → single "Given name" full-width field
 *   ✓ ⓘ button inline with title on same row (no wrapping to new line)
 *   ✓ Section dividers between form groups for breathing room
 */

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import toast from "../utils/toast";
import { useAuth } from "../hooks/useAuth";
import BRAND from "../constants/brand";

// ── helpers ────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1920 - 15 }, (_, i) => currentYear - 16 - i);

function getDaysInMonth(month, year) {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

const ROLE_CARDS = [
  {
    key: "carer",
    label: "Carer",
    headline: "I provide care to a family member or friend",
    icon: "🤝",
    accentClass: "from-indigo-500 to-purple-500",
  },
  {
    key: "employer",
    label: "Employer",
    headline: "I represent an organisation",
    icon: "🏢",
    accentClass: "from-emerald-500 to-teal-500",
  },
];

// ── main component ─────────────────────────────────────────────────
function Register() {
  const navigate = useNavigate();
  const { register, registerWithGoogle } = useAuth();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [step, setStep]           = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod]       = useState(null); // null | "google" | "email"

  // Step 1
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Step 2 — form fields
  const [useSingleName, setUseSingleName] = useState(false);
  const [firstName, setFirstName]         = useState("");
  const [lastName, setLastName]           = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [phone, setPhone]                 = useState("");
  const [dobDay, setDobDay]               = useState("");
  const [dobMonth, setDobMonth]           = useState("");
  const [dobYear, setDobYear]             = useState("");
  const [postcode, setPostcode]           = useState("");
  const [acceptedTerms, setAcceptedTerms]         = useState(false);
  const [consentToResearch, setConsentToResearch] = useState(false);
  const [showConsentInfo, setShowConsentInfo]     = useState(false);

  const [errors, setErrors] = useState({});
  const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: "" }));

  // ── Step 1 ────────────────────────────────────────────────────────
  const toggleRole = (key) => {
    setSelectedRoles((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]
    );
  };

  const handleStep1Continue = () => {
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role to continue.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // ── Method pills ──────────────────────────────────────────────────
  const chooseGoogle = () => {
    setMethod("google");
    if (!acceptedTerms) {
      setErrors((prev) => ({ ...prev, terms: "You must accept the Terms of Service." }));
      toast.error("Please accept the Terms of Service before continuing with Google.");
    }
  };

  const toggleEmail = () => {
    setMethod((prev) => (prev === "email" ? null : "email"));
  };

  // ── Validation ────────────────────────────────────────────────────
  const validate = () => {
    const e = {};

    if (useSingleName) {
      if (!firstName.trim()) e.firstName = "Please enter your given name.";
    } else {
      if (!firstName.trim()) e.firstName = "First name is required.";
      if (!lastName.trim())  e.lastName  = "Last name is required.";
    }

    if (!email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Please enter a valid email.";
    }

    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match.";

    const phoneClean = phone.replace(/\s/g, "");
    if (!phoneClean) {
      e.phone = "Phone number is required.";
    } else if (!/^(\+?61|0)[2-9]\d{8}$/.test(phoneClean)) {
      e.phone = "Enter a valid Australian number (e.g. 0412 345 678).";
    }

    if (!dobDay || !dobMonth || !dobYear) {
      e.dob = "Please enter your full date of birth.";
    } else {
      const dobDate = new Date(dobYear, dobMonth - 1, dobDay);
      const minAge  = new Date();
      minAge.setFullYear(minAge.getFullYear() - 16);
      if (dobDate > minAge) e.dob = "You must be at least 16 years old.";
    }

    if (!postcode.trim()) {
      e.postcode = "Postcode is required.";
    } else if (!/^\d{4}$/.test(postcode.trim())) {
      e.postcode = "Enter a valid 4-digit Australian postcode.";
    }

    if (!acceptedTerms) e.terms = "You must accept the Terms of Service.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Post-signup redirect ──────────────────────────────────────────
  const redirectAfterSignup = (user) => {
    toast.success(`Welcome, ${user.name.split(" ")[0]}! 🎉`);
    const isEmployerOnly = user.roles?.includes("employer") && !user.roles.includes("carer");
    navigate(isEmployerOnly ? "/employer/dashboard" : "/onboarding", { replace: true });
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) { toast.error("Please fix the highlighted fields."); return; }

    setSubmitting(true);
    try {
      const payload = {
        roles: selectedRoles,
        firstName: firstName.trim(),
        lastName: useSingleName ? "" : lastName.trim(),
        useSingleName,
        email: email.trim().toLowerCase(),
        password,
        phone: phone.replace(/\s/g, ""),
        dob: new Date(dobYear, dobMonth - 1, dobDay).toISOString(),
        postcode: postcode.trim(),
        acceptedTerms: true,
        consentToResearch,
      };
      const user = await register(payload);
      redirectAfterSignup(user);
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
      if (err.message?.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: err.message }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async (response) => {
    if (!response.credential) {
      toast.error("Google sign-up did not return a valid credential.");
      return;
    }
    if (!acceptedTerms) {
      setErrors((prev) => ({ ...prev, terms: "You must accept the Terms of Service." }));
      toast.error("Please accept the Terms of Service before continuing with Google.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await registerWithGoogle(response.credential, {
        roles: selectedRoles, acceptedTerms: true, consentToResearch,
      });
      redirectAfterSignup(user);
    } catch (err) {
      toast.error(err.message || "Could not continue with Google.");
    } finally {
      setSubmitting(false);
    }
  };

  const daysInMonth = getDaysInMonth(Number(dobMonth), Number(dobYear));

  // Toggle single name: clear lastName and its error
  const handleToggleSingleName = () => {
    const next = !useSingleName;
    setUseSingleName(next);
    if (next) { setLastName(""); clearError("lastName"); }
    clearError("firstName");
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <section className="flex-1 flex items-center justify-center p-4 py-8 bg-gray-50">
      <div className="w-full max-w-lg">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className={`w-8 h-1.5 rounded-full transition ${step === 1 ? "bg-indigo-600" : "bg-emerald-400"}`} />
          <span className={`w-8 h-1.5 rounded-full transition ${step === 2 ? "bg-indigo-600" : "bg-gray-200"}`} />
        </div>

        {/* Card — tighter padding on mobile, more on desktop */}
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 md:p-10">

          {/* ── STEP 1 ──────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <img src="/logo-icon.png" alt="CareAble" className="w-12 h-12 object-contain mx-auto mb-3" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5">
                  Welcome to {BRAND.text}
                </h1>
                <p className="text-sm text-gray-500">
                  How would you like to use CareAble?{" "}
                  <span className="whitespace-nowrap">You can select more than one.</span>
                </p>
              </div>

              <div className="space-y-2.5 mb-5">
                {ROLE_CARDS.map((role) => {
                  const selected = selectedRoles.includes(role.key);
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => toggleRole(role.key)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.accentClass} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                          {role.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-bold text-sm ${selected ? "text-indigo-700" : "text-gray-900"}`}>
                              {role.label}
                            </p>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                              selected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                            }`}>
                              {selected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{role.headline}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleStep1Continue}
                disabled={selectedRoles.length === 0}
                className={`w-full px-6 py-3 font-semibold rounded-xl transition shadow-sm text-sm ${
                  selectedRoles.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                Continue →
              </button>

              <p className="mt-5 text-sm text-center text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">Log in</Link>
              </p>
            </>
          )}

          {/* ── STEP 2 ──────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-400 hover:text-indigo-600 transition flex items-center gap-1 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
              <p className="text-sm text-gray-500 mb-5">Choose how you&apos;d like to sign up.</p>

              {/* ── Method pills ──────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                {/* Google pill */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={chooseGoogle}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                      method === "google"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <GoogleGlyph />
                    Sign up with Google
                  </button>
                  {acceptedTerms && googleClientId && (
                    <div className="absolute inset-0 z-10 opacity-0 overflow-hidden">
                      <GoogleLogin
                        onSuccess={handleGoogleSignup}
                        onError={() => toast.error("Google sign-up was cancelled or failed.")}
                        text="signup_with"
                        shape="pill"
                        theme="outline"
                        width="320"
                      />
                    </div>
                  )}
                </div>

                {/* Email pill */}
                <button
                  type="button"
                  onClick={toggleEmail}
                  aria-expanded={method === "email"}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                    method === "email"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Sign up with email
                  <svg
                    className={`w-4 h-4 transition-transform ${method === "email" ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* ── Terms + Consent (Google path / no method chosen) ── */}
              {method !== "email" && (
                <>
                  <TermsBox
                    checked={acceptedTerms}
                    onToggle={() => { setAcceptedTerms((v) => !v); clearError("terms"); }}
                    error={errors.terms}
                  />

                  <ConsentBox
                    checked={consentToResearch}
                    onToggle={() => setConsentToResearch((v) => !v)}
                    showInfo={showConsentInfo}
                    onInfoToggle={(e) => { e.stopPropagation(); setShowConsentInfo((v) => !v); }}
                  />
                </>
              )}

              {/* ── Email accordion ───────────────────────────────── */}
              {method === "email" && (
                <form onSubmit={handleSubmit} noValidate className="border-t border-gray-100 pt-5">

                  {/* ── Name section ────────────────────────────── */}
                  {useSingleName ? (
                    /* Single given name — full width */
                    <Field
                      label="Given name" required
                      value={firstName}
                      onChange={(v) => { setFirstName(v); clearError("firstName"); }}
                      error={errors.firstName}
                      placeholder="Your preferred name"
                      autoComplete="given-name"
                    />
                  ) : (
                    /* Two-column first / last */
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="First name" required
                        value={firstName}
                        onChange={(v) => { setFirstName(v); clearError("firstName"); }}
                        error={errors.firstName}
                        placeholder="Jane"
                        autoComplete="given-name"
                      />
                      <Field
                        label="Last name" required
                        value={lastName}
                        onChange={(v) => { setLastName(v); clearError("lastName"); }}
                        error={errors.lastName}
                        placeholder="Smith"
                        autoComplete="family-name"
                      />
                    </div>
                  )}

                  {/* Single-name toggle — sits right below name field(s) */}
                  <div className="flex items-center gap-2.5 mb-5 -mt-1">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={useSingleName}
                      onClick={handleToggleSingleName}
                      className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                        useSingleName ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        useSingleName ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                    <span className="text-xs text-gray-400 select-none">
                      I go by a single / preferred name only
                    </span>
                  </div>

                  {/* ── Account details ──────────────────────────── */}
                  <div className="border-t border-gray-100 pt-4 mb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Account details
                    </p>
                  </div>

                  <Field
                    label="Email" required
                    type="email"
                    value={email}
                    onChange={(v) => { setEmail(v); clearError("email"); }}
                    error={errors.email}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />

                  <Field
                    label="Password" required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(v) => { setPassword(v); clearError("password"); }}
                    error={errors.password}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <Field
                    label="Confirm password" required
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(v) => { setConfirm(v); clearError("confirmPassword"); }}
                    error={errors.confirmPassword}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                  <label className="flex items-center gap-2 mb-4 -mt-2 text-sm text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Show password
                  </label>

                  {/* ── Personal details ─────────────────────────── */}
                  <div className="border-t border-gray-100 pt-4 mb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Personal details
                    </p>
                  </div>

                  <Field
                    label="Mobile number" required
                    type="tel"
                    value={phone}
                    onChange={(v) => { setPhone(v); clearError("phone"); }}
                    error={errors.phone}
                    placeholder="0412 345 678"
                    hint="Australian mobile number"
                    autoComplete="tel"
                  />

                  {/* DOB */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Date of birth <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <StyledSelect
                        value={dobDay}
                        onChange={(v) => { setDobDay(v); clearError("dob"); }}
                        placeholder="Day"
                        options={Array.from({ length: daysInMonth }, (_, i) => ({
                          value: String(i + 1), label: String(i + 1),
                        }))}
                        hasError={!!errors.dob}
                      />
                      <StyledSelect
                        value={dobMonth}
                        onChange={(v) => { setDobMonth(v); clearError("dob"); }}
                        placeholder="Month"
                        options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
                        hasError={!!errors.dob}
                      />
                      <StyledSelect
                        value={dobYear}
                        onChange={(v) => { setDobYear(v); clearError("dob"); }}
                        placeholder="Year"
                        options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
                        hasError={!!errors.dob}
                      />
                    </div>
                    {errors.dob && <p className="text-xs text-red-600 mt-1">{errors.dob}</p>}
                  </div>

                  <Field
                    label="Postcode" required
                    value={postcode}
                    onChange={(v) => { setPostcode(v); clearError("postcode"); }}
                    error={errors.postcode}
                    placeholder="3000"
                    hint="4-digit Australian postcode"
                    inputMode="numeric"
                    maxLength={4}
                  />

                  {/* ── Terms + Consent ───────────────────────────── */}
                  <div className="border-t border-gray-100 pt-4 mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Agreements
                    </p>
                  </div>

                  <TermsBox
                    checked={acceptedTerms}
                    onToggle={() => { setAcceptedTerms((v) => !v); clearError("terms"); }}
                    error={errors.terms}
                  />

                  <ConsentBox
                    checked={consentToResearch}
                    onToggle={() => setConsentToResearch((v) => !v)}
                    showInfo={showConsentInfo}
                    onInfoToggle={(e) => { e.stopPropagation(); setShowConsentInfo((v) => !v); }}
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition shadow-sm inline-flex items-center justify-center gap-2 text-sm"
                  >
                    {submitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating account…
                      </>
                    ) : (
                      "Create account with email"
                    )}
                  </button>
                </form>
              )}

              {method === null && (
                <p className="text-xs text-gray-400 text-center mt-1">
                  Pick a sign-up method above to continue.
                </p>
              )}

              <p className="mt-5 text-sm text-center text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">Log in</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── TermsBox ───────────────────────────────────────────────────────
function TermsBox({ checked, onToggle, error }) {
  return (
    <>
      <div
        className={`rounded-xl border-2 p-3.5 mb-2.5 transition cursor-pointer ${
          checked
            ? "border-indigo-500 bg-indigo-50"
            : error
              ? "border-red-300 bg-red-50"
              : "border-gray-200 hover:border-gray-300"
        }`}
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition ${
            checked ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
          }`}>
            {checked && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              I accept the Terms of Service <span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              You agree to CareAble&apos;s{" "}
              <Link to="/terms" target="_blank" className="text-indigo-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" target="_blank" className="text-indigo-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mb-2.5 -mt-1.5 pl-1">{error}</p>}
    </>
  );
}

// ── ConsentBox ─────────────────────────────────────────────────────
function ConsentBox({ checked, onToggle, showInfo, onInfoToggle }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!showInfo) return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onInfoToggle(e);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showInfo, onInfoToggle]);

  return (
    <div
      className={`rounded-xl border-2 p-3.5 mb-4 transition cursor-pointer relative ${
        checked ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition ${
          checked ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
        }`}>
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {/* Title row — ⓘ is inline, never wraps to new line */}
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              Consent to research use
            </p>
            <span className="text-xs text-gray-400 font-normal whitespace-nowrap">(optional)</span>
            <button
              type="button"
              onClick={onInfoToggle}
              className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-200 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 flex items-center justify-center transition leading-none text-xs font-bold"
              aria-label="More information about research consent"
            >
              i
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            Allow anonymised data use for caregiving research.
          </p>
        </div>
      </div>

      {/* Popover */}
      {showInfo && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-indigo-100 rounded-xl shadow-lg p-4"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold text-gray-900 text-sm">About this consent</p>
            <button
              type="button"
              onClick={onInfoToggle}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            If you tick this, La Trobe University researchers may use your anonymised
            assessment responses to study caregiving patterns and improve support services
            in Australia. Your name and contact details are never shared. You can withdraw
            this consent at any time from your account settings.
          </p>
          <p className="text-xs text-indigo-600 mt-2 font-medium">
            Entirely optional — does not affect your CareAble account.
          </p>
        </div>
      )}
    </div>
  );
}

// ── StyledSelect ───────────────────────────────────────────────────
function StyledSelect({ value, onChange, placeholder, options, hasError }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          hasError
            ? "border-red-300 bg-red-50"
            : open
              ? "border-indigo-400 bg-white"
              : "border-gray-300 bg-white hover:border-gray-400"
        }`}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm transition ${
                  opt.value === value
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Google "G" glyph ───────────────────────────────────────────────
function GoogleGlyph() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

// ── Field ──────────────────────────────────────────────────────────
function Field({
  label, required, value, onChange, error, placeholder,
  hint, type = "text", autoComplete, inputMode, maxLength, disabled,
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        className={`block w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
          disabled
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : error
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-white"
        }`}
      />
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default Register;
