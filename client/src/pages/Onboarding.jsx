// client/src/pages/Onboarding.jsx

/**
 * Carer Onboarding Wizard — Phase 12-B
 * -------------------------------------
 * Appendix 2 questions — mandatory for all carer/dual-role users.
 * No skip option. All fields required before proceeding.
 *
 * Step 1 — Hidden worker status (employment)
 * Step 2 — CALD status (language)
 * Step 3 — Caregiving information
 *
 * "Other" selections reveal a text input.
 * Dropdowns show options only (no re-selectable placeholder).
 * Each step validates before allowing Continue.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "../utils/toast";
import { useAuth } from "../hooks/useAuth";

// ── Option data ────────────────────────────────────────────────────

const EMPLOYMENT_OPTIONS = [
  { value: "full-time", label: "Yes, full-time" },
  { value: "part-time", label: "Yes, part-time" },
  { value: "casual",    label: "Yes, casual"    },
  { value: "none",      label: "Not currently"  },
];

const INDUSTRY_OPTIONS = [
  "Healthcare & social assistance",
  "Education & training",
  "Retail",
  "Hospitality",
  "Administration",
  "Aged care",
  "Disability support",
  "Community services",
  "Other",
];

const LANGUAGE_OPTIONS = [
  "Mandarin", "Arabic", "Vietnamese", "Cantonese", "German",
  "Italian", "Hindi", "Greek", "Spanish", "Nepali", "Other",
];

const HEARD_ABOUT_OPTIONS = [
  "Carers VIC",
  "Carers NSW",
  "Brotherhood of St Laurence",
  "Other carer organisation",
  "WhatsApp group",
  "WeChat group",
  "Friend or family",
  "Search engine",
  "Social media",
  "Other",
];

const CARE_REASON_OPTIONS = [
  "Recognition for my caregiving skills",
  "Advice and resources",
  "Connection with other carers",
  "Job or career support",
  "Research participation",
  "Just exploring",
  "Other",
];

const RELATIONSHIP_OPTIONS = [
  "Parents",
  "Children",
  "Relative",
  "Friends",
  "Other",
];

const AGE_BAND_OPTIONS = [
  "Under 18",
  "18–30",
  "31–50",
  "51–65",
  "66–80",
  "Over 80",
];

const CONDITIONS_OPTIONS = [
  "Dementia",
  "Palliative care",
  "Disability",
  "Mental health",
  "Chronic illness",
  "Recovery from injury",
  "Age-related frailty",
  "Other",
];

const DURATION_OPTIONS = [
  "Less than 1 year",
  "1–3 years",
  "3–5 years",
  "5–7 years",
  "7–10 years",
  "Over 10 years",
];

// ── Main component ─────────────────────────────────────────────────
export default function Onboarding() {
  const { hasRole, refreshUser } = useAuth();
  const navigate = useNavigate();

  const isEmployerOnly =
    hasRole("employer") && !hasRole("carer") && !hasRole("admin");

  const totalSteps = 3;
  const [step, setStep]             = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState({});

  // Step 1
  const [employmentStatus, setEmploymentStatus]           = useState("");
  const [lookingForWork, setLookingForWork]               = useState(null);
  const [appliedForJobRecently, setAppliedForJobRecently] = useState(null);
  const [industryInterests, setIndustryInterests]         = useState([]);
  const [industryOther, setIndustryOther]                 = useState("");

  // Step 2
  const [speaksOtherLanguage, setSpeaksOtherLanguage] = useState(null);
  const [primaryLanguage, setPrimaryLanguage]         = useState("");
  const [languageOther, setLanguageOther]             = useState("");

  // Step 3
  const [heardAboutFrom, setHeardAboutFrom]                       = useState("");
  const [heardAboutOther, setHeardAboutOther]                     = useState("");
  const [careReason, setCareReason]                               = useState("");
  const [careReasonOther, setCareReasonOther]                     = useState("");
  const [careRecipientRelation, setCareRecipientRelation]         = useState("");
  const [careRecipientRelationOther, setCareRecipientRelationOther] = useState("");
  const [careRecipientAgeBand, setCareRecipientAgeBand]           = useState("");
  const [careRecipientConditions, setCareRecipientConditions]     = useState([]);
  const [conditionsOther, setConditionsOther]                     = useState("");
  const [caregivingDuration, setCaregivingDuration]               = useState("");

  // ── Validation ───────────────────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!employmentStatus) e.employmentStatus = "Please select your work situation.";
    if (lookingForWork === null) e.lookingForWork = "Please answer this question.";
    if (appliedForJobRecently === null) e.appliedForJobRecently = "Please answer this question.";
    if (industryInterests.length === 0) e.industryInterests = "Please select at least one industry.";
    if (industryInterests.includes("Other") && !industryOther.trim()) {
      e.industryOther = "Please describe the industry.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (speaksOtherLanguage === null) e.speaksOtherLanguage = "Please answer this question.";
    if (speaksOtherLanguage === true) {
      if (!primaryLanguage) e.primaryLanguage = "Please select your primary language.";
      if (primaryLanguage === "Other" && !languageOther.trim()) {
        e.languageOther = "Please enter your language.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!heardAboutFrom) e.heardAboutFrom = "Please select how you heard about us.";
    if (heardAboutFrom === "Other" && !heardAboutOther.trim()) {
      e.heardAboutOther = "Please describe how you heard about us.";
    }
    if (!careReason) e.careReason = "Please select what brings you here.";
    if (careReason === "Other" && !careReasonOther.trim()) {
      e.careReasonOther = "Please describe your reason.";
    }
    if (!careRecipientRelation) e.careRecipientRelation = "Please select who you care for.";
    if (careRecipientRelation === "Other" && !careRecipientRelationOther.trim()) {
      e.careRecipientRelationOther = "Please describe the relationship.";
    }
    if (!careRecipientAgeBand) e.careRecipientAgeBand = "Please select the age range.";
    if (careRecipientConditions.length === 0) {
      e.careRecipientConditions = "Please select at least one condition.";
    }
    if (careRecipientConditions.includes("Other") && !conditionsOther.trim()) {
      e.conditionsOther = "Please describe the condition.";
    }
    if (!caregivingDuration) e.caregivingDuration = "Please select how long you've been caring.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Navigation ───────────────────────────────────────────────────
  const handleNext = () => {
    const valid = step === 1 ? validateStep1() : validateStep2();
    if (!valid) return;
    setErrors({});
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (!validateStep3()) return;
    setSubmitting(true);
    try {
      const resolvedIndustries = industryInterests.includes("Other")
        ? [...industryInterests.filter((i) => i !== "Other"), industryOther.trim()]
        : industryInterests;

      const resolvedLanguage = primaryLanguage === "Other"
        ? languageOther.trim() : primaryLanguage;

      const resolvedHeardAbout = heardAboutFrom === "Other"
        ? heardAboutOther.trim() : heardAboutFrom;

      const resolvedCareReason = careReason === "Other"
        ? careReasonOther.trim() : careReason;

      const resolvedRelation = careRecipientRelation === "Other"
        ? careRecipientRelationOther.trim() : careRecipientRelation;

      const resolvedConditions = careRecipientConditions.includes("Other")
        ? [...careRecipientConditions.filter((c) => c !== "Other"), conditionsOther.trim()]
        : careRecipientConditions;

      await api.patch("/auth/onboarding", {
        employmentStatus,
        lookingForWork,
        appliedForJobRecently,
        industryInterests: resolvedIndustries,
        speaksOtherLanguage,
        primaryLanguage: speaksOtherLanguage ? resolvedLanguage : null,
        heardAboutFrom: resolvedHeardAbout,
        careReason: resolvedCareReason,
        careRecipientRelation: resolvedRelation,
        careRecipientAgeBand,
        careRecipientConditions: resolvedConditions,
        caregivingDuration,
      });

      await refreshUser();
      toast.success("All set! Welcome to CareAble 🎉");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isEmployerOnly) {
    navigate("/employer/dashboard", { replace: true });
    return null;
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤲</span>
              <span className="font-bold text-gray-900 text-sm">CareAble</span>
            </div>
            <span className="text-xs font-medium text-gray-400">
              Step {step} of {totalSteps}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {["Work", "Language", "Caregiving"].map((label, i) => (
              <span
                key={label}
                className={`text-[10px] font-medium transition ${
                  i + 1 === step ? "text-indigo-600" :
                  i + 1 < step  ? "text-emerald-500" :
                                  "text-gray-300"
                }`}
              >
                {i + 1 < step ? "✓ " : ""}{label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">

        {/* Step heading */}
        <div className="mb-5">
          {step === 1 && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Your work situation</h1>
              <p className="text-sm text-gray-500">
                Caregiving often happens alongside work. Help us understand your context.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Languages you speak</h1>
              <p className="text-sm text-gray-500">
                Helps us support carers from culturally diverse backgrounds.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Your caregiving</h1>
              <p className="text-sm text-gray-500">
                Tell us about who you care for and how you found CareAble.
              </p>
            </>
          )}
        </div>

        {/* ── STEP 1 ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">

            <Section label="Are you working at the moment?" error={errors.employmentStatus}>
              <div className="grid grid-cols-2 gap-2">
                {EMPLOYMENT_OPTIONS.map((opt) => (
                  <ChipButton
                    key={opt.value}
                    selected={employmentStatus === opt.value}
                    onClick={() => {
                      setEmploymentStatus(opt.value);
                      setErrors((p) => ({ ...p, employmentStatus: "" }));
                    }}
                    label={opt.label}
                  />
                ))}
              </div>
            </Section>

            <Section label="Are you looking for work?" error={errors.lookingForWork}>
              <YesNo
                value={lookingForWork}
                onChange={(v) => {
                  setLookingForWork(v);
                  setErrors((p) => ({ ...p, lookingForWork: "" }));
                }}
              />
            </Section>

            <Section
              label="Have you applied for any job within the last 4 weeks?"
              error={errors.appliedForJobRecently}
            >
              <YesNo
                value={appliedForJobRecently}
                onChange={(v) => {
                  setAppliedForJobRecently(v);
                  setErrors((p) => ({ ...p, appliedForJobRecently: "" }));
                }}
              />
            </Section>

            <Section
              label="Which industry interests you?"
              hint="Select all that apply"
              error={errors.industryInterests}
            >
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map((ind) => (
                  <ChipToggle
                    key={ind}
                    selected={industryInterests.includes(ind)}
                    onClick={() => {
                      setIndustryInterests((prev) =>
                        prev.includes(ind)
                          ? prev.filter((i) => i !== ind)
                          : [...prev, ind]
                      );
                      setErrors((p) => ({ ...p, industryInterests: "" }));
                    }}
                    label={ind}
                  />
                ))}
              </div>
              {industryInterests.includes("Other") && (
                <OtherInput
                  value={industryOther}
                  onChange={(v) => {
                    setIndustryOther(v);
                    setErrors((p) => ({ ...p, industryOther: "" }));
                  }}
                  error={errors.industryOther}
                  placeholder="Please describe the industry"
                />
              )}
            </Section>
          </div>
        )}

        {/* ── STEP 2 ──────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">

            <Section
              label="Do you speak a language other than English?"
              error={errors.speaksOtherLanguage}
            >
              <YesNo
                value={speaksOtherLanguage}
                onChange={(v) => {
                  setSpeaksOtherLanguage(v);
                  if (!v) { setPrimaryLanguage(""); setLanguageOther(""); }
                  setErrors((p) => ({ ...p, speaksOtherLanguage: "" }));
                }}
              />
            </Section>

            {speaksOtherLanguage === true && (
              <Section
                label="Which language do you speak?"
                error={errors.primaryLanguage}
              >
                <NativeSelect
                  options={LANGUAGE_OPTIONS}
                  value={primaryLanguage}
                  onChange={(v) => {
                    setPrimaryLanguage(v);
                    setErrors((p) => ({ ...p, primaryLanguage: "" }));
                  }}
                />
                {primaryLanguage === "Other" && (
                  <OtherInput
                    value={languageOther}
                    onChange={(v) => {
                      setLanguageOther(v);
                      setErrors((p) => ({ ...p, languageOther: "" }));
                    }}
                    error={errors.languageOther}
                    placeholder="Please enter your language"
                  />
                )}
              </Section>
            )}
          </div>
        )}

        {/* ── STEP 3 ──────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">

            <Section
              label="How did you hear about this app?"
              error={errors.heardAboutFrom}
            >
              <NativeSelect
                options={HEARD_ABOUT_OPTIONS}
                value={heardAboutFrom}
                onChange={(v) => {
                  setHeardAboutFrom(v);
                  setErrors((p) => ({ ...p, heardAboutFrom: "" }));
                }}
              />
              {heardAboutFrom === "Other" && (
                <OtherInput
                  value={heardAboutOther}
                  onChange={(v) => {
                    setHeardAboutOther(v);
                    setErrors((p) => ({ ...p, heardAboutOther: "" }));
                  }}
                  error={errors.heardAboutOther}
                  placeholder="Please describe how you heard about us"
                />
              )}
            </Section>

            <Section label="What brings you here?" error={errors.careReason}>
              <NativeSelect
                options={CARE_REASON_OPTIONS}
                value={careReason}
                onChange={(v) => {
                  setCareReason(v);
                  setErrors((p) => ({ ...p, careReason: "" }));
                }}
              />
              {careReason === "Other" && (
                <OtherInput
                  value={careReasonOther}
                  onChange={(v) => {
                    setCareReasonOther(v);
                    setErrors((p) => ({ ...p, careReasonOther: "" }));
                  }}
                  error={errors.careReasonOther}
                  placeholder="Please describe your reason"
                />
              )}
            </Section>

            <Section
              label="Who do you care for?"
              error={errors.careRecipientRelation}
            >
              <NativeSelect
                options={RELATIONSHIP_OPTIONS}
                value={careRecipientRelation}
                onChange={(v) => {
                  setCareRecipientRelation(v);
                  setErrors((p) => ({ ...p, careRecipientRelation: "" }));
                }}
              />
              {careRecipientRelation === "Other" && (
                <OtherInput
                  value={careRecipientRelationOther}
                  onChange={(v) => {
                    setCareRecipientRelationOther(v);
                    setErrors((p) => ({ ...p, careRecipientRelationOther: "" }));
                  }}
                  error={errors.careRecipientRelationOther}
                  placeholder="Please describe the relationship"
                />
              )}
            </Section>

            <Section
              label="What is the age of the person you are caring for?"
              error={errors.careRecipientAgeBand}
            >
              <NativeSelect
                options={AGE_BAND_OPTIONS}
                value={careRecipientAgeBand}
                onChange={(v) => {
                  setCareRecipientAgeBand(v);
                  setErrors((p) => ({ ...p, careRecipientAgeBand: "" }));
                }}
              />
            </Section>

            <Section
              label="Which of the following apply to the person you care for?"
              hint="Select all that apply"
              error={errors.careRecipientConditions}
            >
              <div className="flex flex-wrap gap-2">
                {CONDITIONS_OPTIONS.map((cond) => (
                  <ChipToggle
                    key={cond}
                    selected={careRecipientConditions.includes(cond)}
                    onClick={() => {
                      setCareRecipientConditions((prev) =>
                        prev.includes(cond)
                          ? prev.filter((c) => c !== cond)
                          : [...prev, cond]
                      );
                      setErrors((p) => ({ ...p, careRecipientConditions: "" }));
                    }}
                    label={cond}
                  />
                ))}
              </div>
              {careRecipientConditions.includes("Other") && (
                <OtherInput
                  value={conditionsOther}
                  onChange={(v) => {
                    setConditionsOther(v);
                    setErrors((p) => ({ ...p, conditionsOther: "" }));
                  }}
                  error={errors.conditionsOther}
                  placeholder="Please describe the condition"
                />
              )}
            </Section>

            <Section
              label="How long have you cared for this person?"
              error={errors.caregivingDuration}
            >
              <NativeSelect
                options={DURATION_OPTIONS}
                value={caregivingDuration}
                onChange={(v) => {
                  setCaregivingDuration(v);
                  setErrors((p) => ({ ...p, caregivingDuration: "" }));
                }}
              />
            </Section>
          </div>
        )}
      </div>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : (
            <div className="flex-shrink-0 text-xs text-gray-400 px-2">
              Step {step} of {totalSteps}
            </div>
          )}

          <div className="flex-1" />

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Finishing…
                </>
              ) : (
                <>
                  Finish
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────
function Section({ label, hint, error, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-sm font-semibold text-gray-800 mb-0.5">{label}</p>
      {hint && <p className="text-xs text-gray-400 mb-3">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
      {error && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Yes / No ───────────────────────────────────────────────────────
function YesNo({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
          value === true
            ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
            : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
          value === false
            ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
            : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
        }`}
      >
        No
      </button>
    </div>
  );
}

// ── Single-select chip ─────────────────────────────────────────────
function ChipButton({ selected, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition active:scale-95 ${
        selected
          ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
      }`}
    >
      {label}
    </button>
  );
}

// ── Multi-select chip ──────────────────────────────────────────────
function ChipToggle({ selected, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition active:scale-95 ${
        selected
          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
          : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200"
      }`}
    >
      <span className={`w-3.5 h-3.5 rounded flex-shrink-0 border-2 flex items-center justify-center transition ${
        selected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
      }`}>
        {selected && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

// ── Custom dropdown — fully styled, no native select ───────────────
function NativeSelect({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = value || "";

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
          selected
            ? "border-indigo-300 bg-white text-gray-800"
            : "border-gray-200 bg-white text-gray-400"
        } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
      >
        <span>{selected || "Select an option"}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <ul className="max-h-56 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt === selected;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Other text input ───────────────────────────────────────────────
function OtherInput({ value, onChange, error, placeholder }) {
  return (
    <div className="mt-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`block w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
          error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}