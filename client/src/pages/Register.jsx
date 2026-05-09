// client/src/pages/Register.jsx

/**
 * Register Page — Phase 12-B rewrite
 * -----------------------------------
 * Two-step signup flow:
 *   Step 1 — Welcome + role selection (carer / employer / both)
 *   Step 2 — Appendix 1 sign-up details (all roles)
 *
 * After signup:
 *   Carer or dual-role → /onboarding (Appendix 2 carer questions)
 *   Employer-only      → /employer/dashboard
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "../utils/toast";
import { useAuth } from "../hooks/useAuth";

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
    description: "Recognise and validate your caregiving skills with a personalised assessment and certificate.",
    icon: "🤝",
    accentClass: "from-indigo-500 to-purple-500",
  },
  {
    key: "employer",
    label: "Employer",
    headline: "I represent an organisation",
    description: "Verify the authenticity of caregiver certificates issued through CareAble.",
    icon: "🏢",
    accentClass: "from-emerald-500 to-teal-500",
  },
];

// ── main component ─────────────────────────────────────────────────
function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — role selection
  const [selectedRoles, setSelectedRoles] = useState([]);

  // Step 2 — Appendix 1
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

  const [errors, setErrors] = useState({});
  const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: "" }));

  // ── Step 1 logic ─────────────────────────────────────────────────
  const toggleRole = (key) => {
    setSelectedRoles((prev) => {
      if (prev.includes(key)) return prev.filter((r) => r !== key);
      return [...prev, key];
    });
  };

  const handleStep1Continue = () => {
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role to continue.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // ── Step 2 validation ────────────────────────────────────────────
  const validate = () => {
    const e = {};

    // Name
    if (useSingleName) {
      if (!firstName.trim()) e.firstName = "Please enter your preferred name.";
    } else {
      if (!firstName.trim()) e.firstName = "First name is required.";
      if (!lastName.trim())  e.lastName  = "Last name is required.";
    }

    // Email
    if (!email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Please enter a valid email.";
    }

    // Password
    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }
    if (password !== confirmPassword) {
      e.confirmPassword = "Passwords do not match.";
    }

    // Phone
    const phoneClean = phone.replace(/\s/g, "");
    if (!phoneClean) {
      e.phone = "Phone number is required.";
    } else if (!/^(\+?61|0)[2-9]\d{8}$/.test(phoneClean)) {
      e.phone = "Enter a valid Australian number (e.g. 0412 345 678).";
    }

    // DOB
    if (!dobDay || !dobMonth || !dobYear) {
      e.dob = "Please enter your full date of birth.";
    } else {
      const dobDate = new Date(dobYear, dobMonth - 1, dobDay);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 16);
      if (dobDate > minAge) {
        e.dob = "You must be at least 16 years old.";
      }
    }

    // Postcode
    if (!postcode.trim()) {
      e.postcode = "Postcode is required.";
    } else if (!/^\d{4}$/.test(postcode.trim())) {
      e.postcode = "Enter a valid 4-digit Australian postcode.";
    }

    // Terms
    if (!acceptedTerms) {
      e.terms = "You must accept the Terms of Service.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

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
      toast.success(`Welcome, ${user.name.split(" ")[0]}! 🎉`);

      // Route by role
      const isEmployerOnly =
        user.roles?.includes("employer") &&
        !user.roles.includes("carer");

      navigate(isEmployerOnly ? "/employer/dashboard" : "/onboarding", {
        replace: true,
      });
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
      if (err.message?.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: err.message }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const daysInMonth = getDaysInMonth(Number(dobMonth), Number(dobYear));

  // ── Render ───────────────────────────────────────────────────────
  return (
    <section className="flex-1 flex items-center justify-center p-4 py-10 bg-gray-50">
      <div className="w-full max-w-lg">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className={`w-8 h-1.5 rounded-full transition ${step === 1 ? "bg-indigo-600" : "bg-emerald-400"}`} />
          <span className={`w-8 h-1.5 rounded-full transition ${step === 2 ? "bg-indigo-600" : "bg-gray-200"}`} />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">

          {/* ── STEP 1: Role pick ───────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <span className="inline-block text-4xl mb-3">👋</span>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome to CareAble
                </h1>
                <p className="text-gray-500">
                  How would you like to use CareAble? You can select more than one.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {ROLE_CARDS.map((role) => {
                  const selected = selectedRoles.includes(role.key);
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => toggleRole(role.key)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.accentClass} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                          {role.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className={`font-bold ${selected ? "text-indigo-700" : "text-gray-900"}`}>
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
                          <p className="text-sm font-medium text-gray-700 mb-1">{role.headline}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{role.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleStep1Continue}
                disabled={selectedRoles.length === 0}
                className={`w-full px-6 py-3 font-semibold rounded-xl transition shadow-sm ${
                  selectedRoles.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                Continue →
              </button>

              <p className="mt-6 text-sm text-center text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}

          {/* ── STEP 2: Appendix 1 form ─────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-indigo-600 transition flex items-center gap-1 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to role selection
              </button>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Create your account
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                A few details so we can personalise your experience.
              </p>

              {/* Single name toggle */}
              <label className="flex items-center gap-2.5 mb-4 cursor-pointer select-none">
                <div
                  onClick={() => setUseSingleName((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${
                    useSingleName ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    useSingleName ? "translate-x-5" : "translate-x-0"
                  }`} />
                </div>
                <span className="text-sm text-gray-600">
                  I go by a single / preferred name only
                </span>
              </label>

              {/* Name */}
              {useSingleName ? (
                <Field
                  label="Preferred name"
                  value={firstName}
                  onChange={(v) => { setFirstName(v); clearError("firstName"); }}
                  error={errors.firstName}
                  placeholder="e.g. Cher"
                  autoComplete="given-name"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="First name"
                    value={firstName}
                    onChange={(v) => { setFirstName(v); clearError("firstName"); }}
                    error={errors.firstName}
                    placeholder="Jane"
                    autoComplete="given-name"
                  />
                  <Field
                    label="Last name"
                    value={lastName}
                    onChange={(v) => { setLastName(v); clearError("lastName"); }}
                    error={errors.lastName}
                    placeholder="Smith"
                    autoComplete="family-name"
                  />
                </div>
              )}

              {/* Email */}
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={(v) => { setEmail(v); clearError("email"); }}
                error={errors.email}
                placeholder="you@example.com"
                autoComplete="email"
              />

              {/* Password */}
              <Field
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(v) => { setPassword(v); clearError("password"); }}
                error={errors.password}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <Field
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(v) => { setConfirm(v); clearError("confirmPassword"); }}
                error={errors.confirmPassword}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              <label className="flex items-center gap-2 mb-4 -mt-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Show password
              </label>

              {/* Phone */}
              <Field
                label="Mobile number"
                type="tel"
                value={phone}
                onChange={(v) => { setPhone(v); clearError("phone"); }}
                error={errors.phone}
                placeholder="0412 345 678"
                hint="Australian number"
                autoComplete="tel"
              />

              {/* DOB */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date of birth
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={dobDay}
                    onChange={(e) => { setDobDay(e.target.value); clearError("dob"); }}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={dobMonth}
                    onChange={(e) => { setDobMonth(e.target.value); clearError("dob"); }}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={dobYear}
                    onChange={(e) => { setDobYear(e.target.value); clearError("dob"); }}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">Year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {errors.dob && (
                  <p className="text-xs text-red-600 mt-1">{errors.dob}</p>
                )}
              </div>

              {/* Postcode */}
              <Field
                label="Postcode"
                value={postcode}
                onChange={(v) => { setPostcode(v); clearError("postcode"); }}
                error={errors.postcode}
                placeholder="3000"
                hint="Your 4-digit Australian postcode"
                inputMode="numeric"
                maxLength={4}
              />

              {/* Terms */}
              <div
                className={`rounded-xl border-2 p-4 mb-3 transition cursor-pointer ${
                  acceptedTerms
                    ? "border-indigo-500 bg-indigo-50"
                    : errors.terms
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => { setAcceptedTerms((v) => !v); clearError("terms"); }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition ${
                    acceptedTerms ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                  }`}>
                    {acceptedTerms && (
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
                      You agree to CareAble's{" "}
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
              {errors.terms && <p className="text-xs text-red-600 mb-3 -mt-1">{errors.terms}</p>}

              {/* Research consent */}
              <div
                className={`rounded-xl border-2 p-4 mb-6 transition cursor-pointer ${
                  consentToResearch
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setConsentToResearch((v) => !v)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition ${
                    consentToResearch ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                  }`}>
                    {consentToResearch && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Consent to research use{" "}
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Allow La Trobe University to use my anonymised assessment data
                      for caregiving research.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition shadow-sm inline-flex items-center justify-center gap-2"
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
                  "Create account"
                )}
              </button>

              <p className="mt-6 text-sm text-center text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Reusable field ─────────────────────────────────────────────────
function Field({ label, value, onChange, error, placeholder, hint, type = "text", autoComplete, inputMode, maxLength }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`block w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
          error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
        }`}
      />
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default Register;