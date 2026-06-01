// client/src/pages/Assessment.jsx

import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "../utils/toast";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

const QUESTIONS_PER_PAGE = 6;

const LIKERT_OPTIONS = [
  { value: "1", label: "Never",     short: "1" },
  { value: "2", label: "Rarely",    short: "2" },
  { value: "3", label: "Sometimes", short: "3" },
  { value: "4", label: "Often",     short: "4" },
  { value: "5", label: "Always",    short: "5" },
];

const FREQUENCY_OPTIONS = [
  { value: "never",     label: "Never"     },
  { value: "rarely",    label: "Rarely"    },
  { value: "sometimes", label: "Sometimes" },
  { value: "often",     label: "Often"     },
  { value: "always",    label: "Always"    },
];

export default function Assessment() {
  const navigate = useNavigate();

  const [questions, setQuestions]       = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [answers, setAnswers]           = useState({});
  const [currentPage, setCurrentPage]   = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [savingIds, setSavingIds]       = useState(new Set());
  const [assessmentExpiresAt, setAssessmentExpiresAt] = useState(null);
  const [introOpen, setIntroOpen]       = useState(true);

  const hasStarted   = useRef(false);
  const rushedNudge  = useRef(false);
  const recentTimes  = useRef([]);
  const questionRefs = useRef({});

  // Hide footer only on this page
  useEffect(() => {
    document.body.classList.add("hide-footer");
    return () => document.body.classList.remove("hide-footer");
  }, []);

  // Load assessment
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const load = async () => {
      try {
        const startRes = await api.post("/assessments/start");
        const started  = startRes.data.data.assessment;
        setAssessmentExpiresAt(started.expiresAt || null);
        if (startRes.data.data.expiredDraftDeleted) {
          toast.info("Your previous in-progress assessment expired, so we started a fresh one with the latest questions.");
        }

        const questionsRes = await api.get("/questions", {
          params: { assessmentId: started._id },
        });

        const flat = questionsRes.data.data.questions;
        setQuestions(flat);
        setAssessmentId(started._id);

        const savedAnswers = {};
        if (started.answers && typeof started.answers === "object") {
          for (const [qId, payload] of Object.entries(started.answers)) {
            savedAnswers[qId] = payload.value ?? payload.values ?? null;
          }
        }
        setAnswers(savedAnswers);

        if (Object.keys(savedAnswers).length > 0 && flat.length > 0) {
          const firstUnansweredIdx = flat.findIndex(
            (q) => !savedAnswers[q._id.toString()]
          );
          if (firstUnansweredIdx > 0) {
            setCurrentPage(Math.floor(firstUnansweredIdx / QUESTIONS_PER_PAGE));
          }
        }
      } catch (err) {
        if (err.status === 410 || err.extra?.expiredAssessment) {
          toast.error("This assessment expired. Please start again to use the latest questions.");
          navigate("/dashboard");
          return;
        }
        if (err.status === 429 && err.extra?.cooldown?.active) {
          const days = err.extra.cooldown.daysRemaining;
          toast.error(`Retake available in ${days} day${days === 1 ? "" : "s"}.`);
          navigate("/dashboard");
          return;
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  // Derived state
  const totalQuestions = questions.length;
  const totalPages     = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
  const answeredCount  = Object.keys(answers).length;
  const allAnswered    = answeredCount >= totalQuestions && totalQuestions > 0;
  const hasSavedProgress = answeredCount > 0;
  const expiryText = formatExpiryText(assessmentExpiresAt);
  const expiryDateText = formatExpiryDate(assessmentExpiresAt);
  const progressPercent = totalQuestions > 0
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  const pageQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );

  // Answer saving
  const saveAnswer = useCallback(async (questionId, question, rawValue) => {
    if (!assessmentId) return;
    const qIdStr = questionId.toString();

    setAnswers((prev) => ({ ...prev, [qIdStr]: rawValue }));
    setSavingIds((prev) => new Set(prev).add(qIdStr));

    const now = Date.now();
    recentTimes.current.push(now);
    if (recentTimes.current.length > 5) recentTimes.current.shift();
    if (recentTimes.current.length === 5) {
      const avgGap = (recentTimes.current[4] - recentTimes.current[0]) / 4;
      if (avgGap < 3000 && !rushedNudge.current) {
        rushedNudge.current = true;
        toast.info("Take your time — honest reflection gives the best results 🌿");
      }
    }

    try {
      const body = { questionId: qIdStr };
      if (question.type === "multi") {
        body.values = Array.isArray(rawValue) ? rawValue : [];
      } else {
        body.value = String(rawValue);
      }
      await api.patch(`/assessments/${assessmentId}/answer`, body);
    } catch (err) {
      if (err.status === 410 || err.extra?.expiredAssessment) {
        toast.error("This assessment expired. Starting a fresh one now.");
        navigate("/assessment", { replace: true });
        return;
      }
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[qIdStr];
        return next;
      });
      toast.error("Could not save answer — please try again");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(qIdStr);
        return next;
      });
    }
  }, [assessmentId, navigate]);

  const handleAnswerSelect = useCallback((question, rawValue) => {
    saveAnswer(question._id, question, rawValue);
    if (question.type === "multi") return;

    const qIdStr     = question._id.toString();
    const currentIdx = pageQuestions.findIndex((q) => q._id.toString() === qIdStr);

    for (let i = currentIdx + 1; i < pageQuestions.length; i++) {
      const nextQ = pageQuestions[i];
      if (answers[nextQ._id.toString()] === undefined) {
        setTimeout(() => {
          questionRefs.current[nextQ._id.toString()]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 180);
        break;
      }
    }
  }, [saveAnswer, pageQuestions, answers]);

  // Navigation
  const goToPage = (page) => {
    setCurrentPage(page);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      }, 50);
      };

  const handleNext = () => { if (currentPage < totalPages - 1) goToPage(currentPage + 1); };
  const handleBack = () => { if (currentPage > 0) goToPage(currentPage - 1); };

  // Submit
  const handleSubmit = async () => {
    if (!assessmentId) return;
    if (!allAnswered) {
      toast.error(
        `${totalQuestions - answeredCount} question${totalQuestions - answeredCount === 1 ? "" : "s"} still need answers — check previous pages.`
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/assessments/${assessmentId}/submit`);
      toast.success("Assessment submitted! 🎉");
      setTimeout(() => navigate(`/results/${res.data.data.assessment._id}`), 400);
    } catch (err) {
      if (err.status === 410 || err.extra?.expiredAssessment) {
        toast.error("This assessment expired. Please start again to use the latest questions.");
        navigate("/dashboard");
        return;
      }
      toast.error(
        err.message?.toLowerCase().includes("verify")
          ? "Please verify your email first before submitting."
          : err.message
      );
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your assessment..." />;

  if (error) {
    return (
      <section className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-1">Could not load assessment</p>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link to="/dashboard" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">
            Back to dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {introOpen && (
        <AssessmentIntroModal
          isResume={hasSavedProgress}
          totalQuestions={totalQuestions}
          answeredCount={answeredCount}
          expiryText={expiryText}
          expiryDateText={expiryDateText}
          onStart={() => setIntroOpen(false)}
          onExit={() => navigate("/dashboard")}
        />
      )}

      {/* ── Sticky exit button — top right corner ── */}
      <div className="sticky top-2 z-40 pointer-events-none">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-end py-2">
            <Link
              to="/dashboard"
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-medium text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 shadow-sm transition group"
            >
              <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Save & Exit
            </Link>
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="max-w-2xl mx-auto px-4 pt-2 pb-28">

        {/* Page heading */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            Page {currentPage + 1} of {totalPages}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentPage === 0
              ? "Let's start your assessment"
              : currentPage === totalPages - 1
              ? "Almost there"
              : "Keep going"}
          </h1>
          <p className="text-base text-gray-500 mt-1">
            Answer honestly — there are no right or wrong answers.
          </p>
        </div>

        {/* Question cards */}
        <div className="space-y-4">
          {pageQuestions.map((question, idx) => {
            const qId  = question._id.toString();
            const qNum = currentPage * QUESTIONS_PER_PAGE + idx + 1;
            return (
              <QuestionCard
                key={qId}
                question={question}
                questionNumber={qNum}
                answer={answers[qId]}
                saving={savingIds.has(qId)}
                onAnswer={(val) => handleAnswerSelect(question, val)}
                innerRef={(el) => { questionRefs.current[qId] = el; }}
              />
            );
          })}
        </div>

        {/* Last page status card */}
        {currentPage === totalPages - 1 && (
          <div className="mt-6">
            {allAnswered ? (
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 text-center shadow-sm">
                <p className="text-base font-bold text-gray-900 mb-0.5">All done! 🎉</p>
                <p className="text-sm text-gray-500">Hit Submit below to get your results.</p>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-center">
                <p className="text-sm text-amber-800 font-medium">
                  {totalQuestions - answeredCount} question{totalQuestions - answeredCount === 1 ? "" : "s"} remaining
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Use the page dots below to go back and complete them.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Fixed bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40">

        {/* Gradient progress bar — flush top edge */}
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-2.5">
          <div className="max-w-2xl mx-auto flex items-center gap-2">

            {/* Back */}
            <button
              onClick={handleBack}
              disabled={currentPage === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Centre — dots + progress count */}
            <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              {/* Progress count */}
              <p className="text-sm text-gray-400 leading-none">
                <span className="font-semibold text-indigo-600">{answeredCount}</span>
                <span className="text-gray-300 mx-1">/</span>
                {totalQuestions}
                <span className="ml-1 text-gray-400">answered</span>
              </p>

              {/* Page dots */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageQs   = questions.slice(i * QUESTIONS_PER_PAGE, (i + 1) * QUESTIONS_PER_PAGE);
                  const pageDone = pageQs.every((q) => answers[q._id.toString()] !== undefined);
                  const isCurrent = i === currentPage;
                  return (
                    <button
                      key={i}
                      onClick={() => goToPage(i)}
                      title={`Page ${i + 1}`}
                      className={`rounded-full transition-all duration-300 ${
                        isCurrent ? "w-5 h-2 bg-indigo-600" :
                        pageDone  ? "w-2 h-2 bg-emerald-400 hover:bg-emerald-500" :
                                    "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to page ${i + 1}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Next / Submit */}
            {currentPage < totalPages - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition flex-shrink-0"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition flex-shrink-0 ${
                  submitting
                    ? "bg-indigo-400 text-white cursor-not-allowed"
                    : allAnswered
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                }`}
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={allAnswered ? "M5 13l4 4L19 7" : "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── QuestionCard ───────────────────────────────────────────────────
function AssessmentIntroModal({
  isResume,
  totalQuestions,
  answeredCount,
  expiryText,
  expiryDateText,
  onStart,
  onExit,
}) {
  const primaryLabel = isResume ? "Continue assessment" : "Start assessment";
  const title = isResume ? "Resume your assessment" : "Before you begin";

  const instructions = [
    "No right or wrong answers. Use your own caregiving experience.",
    "Answers save automatically, so you can exit and return before expiry.",
    "All questions must be answered before submission.",
    "After submission, results and certificate are locked.",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-3 py-3 sm:px-4 sm:py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-intro-title"
    >
      <div className="flex w-full max-w-lg max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-[min(720px,calc(100dvh-3rem))]">
        <div className="shrink-0 border-b border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Assessment instructions
              </p>
              <h2 id="assessment-intro-title" className="mt-1 text-xl sm:text-2xl font-bold leading-tight text-gray-950">
                {title}
              </h2>
            </div>
            <div className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
              {answeredCount}/{totalQuestions || 0}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 sm:px-4">
            <div className="flex items-start gap-2.5">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-amber-900">
                  In-progress assessments expire {expiryText || "after 7 days"}.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  Expired drafts are deleted, and the next attempt uses the latest questions and domains.
                  {expiryDateText ? ` Expires ${expiryDateText}.` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-2.5">
            {instructions.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <p className="text-sm leading-snug text-gray-600">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 sm:px-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Test-style reminder</p>
            <p className="mt-1 text-sm leading-snug text-gray-700">
              Take your time and answer honestly. The assessment is designed for reflection, not speed.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex flex-col-reverse gap-2 border-t border-gray-100 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={onStart}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatExpiryText(expiresAt) {
  if (!expiresAt) return "";
  const msRemaining = new Date(expiresAt).getTime() - Date.now();
  if (msRemaining <= 0) return "soon";

  const dayMs = 24 * 60 * 60 * 1000;
  if (msRemaining >= dayMs) {
    const days = Math.ceil(msRemaining / dayMs);
    return `in ${days} day${days === 1 ? "" : "s"}`;
  }

  const hours = Math.ceil(msRemaining / (60 * 60 * 1000));
  return `in ${hours} hour${hours === 1 ? "" : "s"}`;
}

function formatExpiryDate(expiresAt) {
  if (!expiresAt) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(expiresAt));
}

function QuestionCard({ question, questionNumber, answer, saving, onAnswer, innerRef }) {
  return (
    <div
      ref={innerRef}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        answer !== undefined ? "border-emerald-200 shadow-sm" : "border-gray-200 shadow-sm"
      }`}
    >
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-semibold text-gray-400 flex-shrink-0 mt-0.5">
            Q{questionNumber}
          </span>
          {saving ? (
            <svg className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : answer !== undefined ? (
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </div>
        <p className="text-gray-900 font-medium text-sm sm:text-base leading-snug mt-1">
          {question.text}
        </p>
        {question.helper && (
          <p className="text-xs text-gray-400 mt-1.5">{question.helper}</p>
        )}
      </div>

      <div className="px-4 pb-4">
        {question.type === "likert" && <LikertButtons value={answer} onChange={onAnswer} />}
        {question.type === "frequency" && <FrequencyButtons value={answer} onChange={onAnswer} />}
        {question.type === "multi" && (
          <MultiSelect options={question.options || []} value={Array.isArray(answer) ? answer : []} onChange={onAnswer} />
        )}
      </div>
    </div>
  );
}

// ── LikertButtons ──────────────────────────────────────────────────
function LikertButtons({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-1.5">
        {LIKERT_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 transition-all active:scale-95 ${
                selected
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                  : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
              }`}
            >
              <span className="text-base font-bold leading-none">{opt.short}</span>
              <span className={`text-xs leading-tight text-center hidden sm:block ${selected ? "text-indigo-100" : "text-gray-400"}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between px-1">
        <span className="text-xs text-gray-400">Never</span>
        <span className="text-xs text-gray-400">Always</span>
      </div>
    </div>
  );
}

// ── FrequencyButtons ───────────────────────────────────────────────
function FrequencyButtons({ value, onChange }) {
  return (
    <div className="space-y-2">
      {FREQUENCY_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-[0.99] ${
              selected
                ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            <span>{opt.label}</span>
            {selected && (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── MultiSelect ────────────────────────────────────────────────────
function MultiSelect({ options, value, onChange }) {
  const toggle = (opt) => {
    const next = value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-400 mb-1">Select all that apply</p>
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all active:scale-[0.99] ${
              selected
                ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gray-50"
            }`}
          >
            <span className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition ${
              selected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
            }`}>
              {selected && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="flex-1">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
