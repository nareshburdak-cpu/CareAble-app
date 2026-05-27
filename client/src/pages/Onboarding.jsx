// client/src/pages/Onboarding.jsx

/**
 * Onboarding Wizard
 * -----------------
 * Step 0 — Contact details (phone, DOB, postcode)
 *          ONLY shown for users missing these (Google signups).
 *          Email signups collect them at registration → skip Step 0.
 * Step 1 — Hidden worker status (employment)
 * Step 2 — CALD status (language)
 * Step 3 — Caregiving information
 *
 * "Other" selections reveal a text input.
 * Each step validates before allowing Continue.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "../utils/toast";
import { useAuth } from "../hooks/useAuth";

// ── DOB helpers (match Register page) ──────────────────────────────
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1920 - 15 }, (_, i) => currentYear - 16 - i);

function getDaysInMonth(month, year) {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

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
  const { user, hasRole, refreshUser } = useAuth();
  const navigate = useNavigate();

  const isEmployerOnly =
    hasRole("employer") && !hasRole("carer") && !hasRole("admin");

  // Does this user still need contact details? (Google signups won't have phone)
  const needsContactStep = !user?.phone;

  // Build the active step list. Step 0 is conditional.
  // steps = ["contact", "work", "language", "caregiving"] OR ["work", "language", "caregiving"]
  const steps = needsContactStep
    ? ["contact", "work", "language", "caregiving"]
    : ["work", "language", "caregiving"];
  const totalSteps = steps.length;

  const [stepIndex, setStepIndex]   = useState(0); // 0-based index into `steps`
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState({});

  const currentStep = steps[stepIndex];

  // ── Step 0 — Contact details ─────────────────────────────────────
  const [phone, setPhone]       = useState("");
  const [dobDay, setDobDay]     = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear]   = useState("");
  const [postcode, setPostcode] = useState("");

  // ── Step 1 — Work ────────────────────────────────────────────────
  const [employmentStatus, setEmploymentStatus]           = useState("");
  const [lookingForWork, setLookingForWork]               = useState(null);
  const [appliedForJobRecently, setAppliedForJobRecently] = useState(null);
  const [industryInterests, setIndustryInterests]         = useState([]);
  const [industryOther, setIndustryOther]                 = useState("");

  // ── Step 2 — Language ────────────────────────────────────────────
  const [speaksOtherLanguage, setSpeaksOtherLanguage] = useState(null);
  const [primaryLanguage, setPrimaryLanguage]         = useState("");
  const [languageOther, setLanguageOther]             = useState("");

  // ── Step 3 — Caregiving ──────────────────────────────────────────
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

  const daysInMonth = getDaysInMonth(Number(dobMonth), Number(dobYear));

  // ── Validation ───────────────────────────────────────────────────
  const validateContact = () => {
    const e = {};
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
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 16);
      if (dobDate > minAge) e.dob = "You must be at least 16 years old.";
    }
    if (!postcode.trim()) {
      e.postcode = "Postcode is required.";
    } else if (!/^\d{4}$/.test(postcode.trim())) {
      e.postcode = "Enter a valid 4-digit Australian postcode.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateWork = () => {
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

  const validateLanguage = () => {
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

  const validateCaregiving = () => {
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

  const validateCurrentStep = () => {
    switch (currentStep) {
      case "contact":    return validateContact();
      case "work":       return validateWork();
      case "language":   return validateLanguage();
      case "caregiving": return validateCaregiving();
      default:           return true;
    }
  };

  // ── Navigation ───────────────────────────────────────────────────
  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setErrors({});
    setStepIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleBack = () => {
    setErrors({});
    setStepIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (!validateCaregiving()) return;
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

      const payload = {
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
      };

      // Only send contact fields if we collected them (Google users)
      if (needsContactStep) {
        payload.phone = phone.replace(/\s/g, "");
        payload.dob = new Date(dobYear, dobMonth - 1, dobDay).toISOString();
        payload.postcode = postcode.trim();
      }

      await api.patch("/auth/onboarding", payload);

      await refreshUser();
      toast.success("All set! Welcome to CareAble 🎉");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Employer-only users shouldn't be here — bounce them
  if (isEmployerOnly) {
    navigate("/employer/dashboard", { replace: true });
    return null;
  }

  const isLastStep = stepIndex === totalSteps - 1;

  // Step labels for the progress header (adapts to whether Step 0 exists)
  const stepLabels = needsContactStep
    ? ["Details", "Work", "Language", "Caregiving"]
    : ["Work", "Language", "Caregiving"];

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Sticky top bar ──────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 shadow-sm px-4 py-2">
        <div className="max-w-lg mx-auto">

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤲</span>
              <span className="font-bold text-stone-900 text-base">CareAble</span>
            </div>
            <span className="text-xs font-medium text-stone-400">
              Step {stepIndex + 1} of {totalSteps}
            </span>
          </div>

          <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div className="flex justify-between mt-1">
            {stepLabels.map((label, i) => (
              <span
                key={label}
                className={`text-[11px] font-medium transition ${
                  i === stepIndex ? "text-indigo-600" :
                  i < stepIndex  ? "text-emerald-500" :
                                   "text-stone-300"
                }`}
              >
                {i < stepIndex ? "✓ " : ""}{label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">

        {/* Step heading */}
        <div className="mb-5">
          {currentStep === "contact" && (
            <>
              <h1 className="text-2xl font-bold text-stone-900 mb-1">Your contact details</h1>
              <p className="text-base text-stone-500">
                A few details to complete your CareAble profile.
              </p>
            </>
          )}
          {currentStep === "work" && (
            <>
              <h1 className="text-2xl font-bold text-stone-900 mb-1">Your work situation</h1>
              <p className="text-base text-stone-500">
                Caregiving often happens alongside work. Help us understand your context.
              </p>
            </>
          )}
          {currentStep === "language" && (
            <>
              <h1 className="text-2xl font-bold text-stone-900 mb-1">Languages you speak</h1>
              <p className="text-base text-stone-500">
                Helps us support carers from culturally diverse backgrounds.
              </p>
            </>
          )}
          {currentStep === "caregiving" && (
            <>
              <h1 className="text-2xl font-bold text-stone-900 mb-1">Your caregiving</h1>
              <p className="text-base text-stone-500">
                Tell us about who you care for and how you found CareAble.
              </p>
            </>
          )}
        </div>

        {/* ── STEP 0 — Contact ────────────────────────────────────── */}
        {currentStep === "contact" && (
          <div className="space-y-4">

            <Section label="Mobile number" hint="Australian mobile number" error={errors.phone}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((p) => ({ ...p, phone: "" }));
                }}
                placeholder="0412 345 678"
                autoComplete="tel"
                className={`block w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  errors.phone ? "border-red-300 bg-red-50" : "border-stone-300 bg-white"
                }`}
              />
            </Section>

            <Section label="Date of birth" error={errors.dob}>
              <div className="grid grid-cols-3 gap-2">
                <NativeSelect
                  options={Array.from({ length: daysInMonth }, (_, i) => String(i + 1))}
                  value={dobDay}
                  placeholder="Day"
                  onChange={(v) => { setDobDay(v); setErrors((p) => ({ ...p, dob: "" })); }}
                />
                <NativeSelect
                  options={MONTHS}
                  value={dobMonth ? MONTHS[Number(dobMonth) - 1] : ""}
                  placeholder="Month"
                  onChange={(v) => {
                    setDobMonth(String(MONTHS.indexOf(v) + 1));
                    setErrors((p) => ({ ...p, dob: "" }));
                  }}
                />
                <NativeSelect
                  options={YEARS.map(String)}
                  value={dobYear}
                  placeholder="Year"
                  onChange={(v) => { setDobYear(v); setErrors((p) => ({ ...p, dob: "" })); }}
                />
              </div>
            </Section>

            <Section label="Postcode" hint="4-digit Australian postcode" error={errors.postcode}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={postcode}
                onChange={(e) => {
                  setPostcode(e.target.value.replace(/\D/g, "").slice(0, 4));
                  setErrors((p) => ({ ...p, postcode: "" }));
                }}
                placeholder="3000"
                className={`block w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                  errors.postcode ? "border-red-300 bg-red-50" : "border-stone-300 bg-white"
                }`}
              />
            </Section>
          </div>
        )}

        {/* ── STEP 1 — Work ───────────────────────────────────────── */}
        {currentStep === "work" && (
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

        {/* ── STEP 2 — Language ───────────────────────────────────── */}
        {currentStep === "language" && (
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
                  placeholder="Select an option"
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

        {/* ── STEP 3 — Caregiving ─────────────────────────────────── */}
        {currentStep === "caregiving" && (
          <div className="space-y-4">

            <Section
              label="How did you hear about this app?"
              error={errors.heardAboutFrom}
            >
              <NativeSelect
                options={HEARD_ABOUT_OPTIONS}
                value={heardAboutFrom}
                placeholder="Select an option"
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
                placeholder="Select an option"
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
                placeholder="Select an option"
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
                placeholder="Select an option"
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
                placeholder="Select an option"
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {stepIndex > 0 ? (
            <button
              onClick={handleBack}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition disabled:opacity-50 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : (
            <div className="flex-shrink-0 text-xs text-stone-400 px-2">
              Step {stepIndex + 1} of {totalSteps}
            </div>
          )}

          <div className="flex-1" />

          {!isLastStep ? (
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
function Section({ label, hint, error, required = true, children }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
      <p className="text-sm font-semibold text-stone-800 mb-0.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {hint && <p className="text-sm text-stone-400 mb-3">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
      {error && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
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
            : "border-stone-200 bg-white text-stone-700 hover:border-indigo-300"
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
            : "border-stone-200 bg-white text-stone-700 hover:border-indigo-300"
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
          : "border-stone-200 bg-white text-stone-700 hover:border-indigo-300 hover:bg-indigo-50"
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
          : "border-stone-200 bg-white text-stone-600 hover:border-indigo-200"
      }`}
    >
      <span className={`w-3.5 h-3.5 rounded flex-shrink-0 border-2 flex items-center justify-center transition ${
        selected ? "bg-indigo-600 border-indigo-600" : "border-stone-300"
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

// ── Custom dropdown ────────────────────────────────────────────────
function NativeSelect({ options, value, onChange, placeholder = "Select an option" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
          selected
            ? "border-indigo-300 bg-white text-stone-800"
            : "border-stone-200 bg-white text-stone-400"
        } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
      >
        <span>{selected || placeholder}</span>
        <svg
          className={`w-4 h-4 text-stone-400 transition-transform flex-shrink-0 ml-2 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          <ul className="max-h-56 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt === selected;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-stone-700 hover:bg-stone-50"
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
          error ? "border-red-300 bg-red-50" : "border-stone-300 bg-white"
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}