/**
 * Assessment Page
 * ---------------
 * Main self-assessment questionnaire — with live answer saving.
 *
 * Wrapped in <AssessmentSecurityShell> for screenshot deterrence:
 *   - User-select disabled (text can't be highlighted)
 *   - Right-click disabled
 *   - Print disabled (Ctrl+P shows blank)
 *   - Identity watermark tiled across page
 *   - Blur on tab/app switch
 *   - Confidentiality notice banner
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "../utils/toast";

import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import ProgressBar from "../components/ProgressBar";
import CategorySection from "../components/CategorySection";
import LoadingSpinner from "../components/LoadingSpinner";
import AssessmentSecurityShell from "../components/AssessmentSecurityShell";

function Assessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // StrictMode double-mount guard — prevents the load() function
  // from firing twice in dev mode (which would create duplicate assessments).
  const hasStarted = useRef(false);
  const rushedNudgeShown = useRef(false);
  const recentAnswerTimes = useRef([]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const load = async () => {
      try {
        // 1. Start (or resume) the assessment FIRST.
        const startRes = await api.post("/assessments/start");
        const started = startRes.data.data.assessment;

        // 2. Fetch questions ordered for THIS assessment.
        const questionsRes = await api.get("/questions", {
          params: { assessmentId: started._id },
        });

        setCategories(questionsRes.data.data.categories);
        setAssessmentId(started._id);
        setAnswers(started.answers || {});
      } catch (err) {
        // Cooldown handler
        if (err.status === 429 && err.extra?.cooldown?.active) {
          const days = err.extra.cooldown.daysRemaining;
          toast.error(`Retake available in ${days} day${days === 1 ? "" : "s"}.`);
          navigate("/dashboard");
          return;
        }
        setError(err.message);
        toast.error("Could not load assessment");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  // Track recent answer timestamps for rapid-click detection
  // Called by QuestionCard after a successful save
  const handleAnswerSaved = (questionId, payload) => {
    const now = Date.now();

    // Track timestamps
    recentAnswerTimes.current.push(now);
    // Keep only the last 5
    if (recentAnswerTimes.current.length > 5) {
      recentAnswerTimes.current.shift();
    }

    // If we have 5 rapid answers (< 3 sec apart on average), gently nudge once
    if (recentAnswerTimes.current.length === 5) {
      const span = recentAnswerTimes.current[4] - recentAnswerTimes.current[0];
      const avgGap = span / 4;   // 4 gaps between 5 timestamps

      if (avgGap < 3000 && !rushedNudgeShown.current) {
        rushedNudgeShown.current = true;
        toast.info("Take your time — there's no rush. Honest reflection gives the best results. 🌿");
      }
    }

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...payload,
        answeredAt: new Date().toISOString(),
      },
    }));
  };

  const handleAnswerCleared = (questionId) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!assessmentId) return;
    if (answeredCount < totalQuestions) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/assessments/${assessmentId}/submit`);
      toast.success("Assessment submitted! 🎉");

      setTimeout(() => {
        navigate(`/results/${res.data.data.assessment._id}`);
      }, 500);
    } catch (err) {
      if (err.message?.toLowerCase().includes("verify")) {
        toast.error("Please verify your email first to submit your assessment.");
      } else {
        toast.error(err.message);
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your assessment..." />;
  }

  if (error) {
    return (
      <section className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">⚠️ {error}</p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    );
  }

  const totalQuestions = categories.reduce((sum, c) => sum + c.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  return (
    <AssessmentSecurityShell user={user}>
      <section className="flex-1 p-4 md:p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {/* Smart header: full version at top, compact when scrolled */}
          <AssessmentHeader
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
          />

          {/* Category accordion sections */}
          <div className="space-y-3">
            {categories.map((category, idx) => (
              <CategorySection
                key={category.key}
                category={category}
                answers={answers}
                defaultOpen={idx === 0}
                assessmentId={assessmentId}
                onAnswerSaved={handleAnswerSaved}
                onAnswerCleared={handleAnswerCleared}
              />
            ))}
          </div>

          {/* Submit section */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            {answeredCount === totalQuestions ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  All questions answered!
                </h3>
                <p className="text-gray-500 mb-6">
                  Ready to see your personalised capability results and certificate?
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Scoring your answers...
                    </>
                  ) : (
                    <>
                      Submit Assessment
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 mb-3">
                  You have answered{" "}
                  <span className="font-semibold text-gray-900">
                    {answeredCount} of {totalQuestions}
                  </span>{" "}
                  questions.
                </p>
                <p className="text-sm text-gray-400">
                  Complete all questions to unlock your capability results.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </AssessmentSecurityShell>
  );
}

// ---- Smart header that swaps full → compact on scroll ----
function AssessmentHeader({ answeredCount, totalQuestions }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 120);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const percent = totalQuestions > 0
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  return (
    <>
      {/* Full header — collapses on scroll */}
      <div
        style={{
          maxHeight: scrolled ? "0px" : "200px",
          opacity: scrolled ? 0 : 1,
          overflow: "hidden",
          transition: "max-height 400ms ease, opacity 280ms ease",
          marginBottom: scrolled ? "0" : "1rem",
        }}
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Self-Assessment
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Expand each section to answer. Your progress saves automatically.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="text-sm text-gray-600 hover:text-indigo-600 transition self-start sm:self-center whitespace-nowrap"
            >
              ← Back to dashboard
            </Link>
          </div>
          <ProgressBar
            value={answeredCount}
            max={totalQuestions}
            color="bg-indigo-600"
          />
        </div>
      </div>

      {/* Compact sticky bar — fades in on scroll */}
      <div
        style={{
          opacity: scrolled ? 1 : 0,
          pointerEvents: scrolled ? "auto" : "none",
          transition: "opacity 300ms ease",
          transitionDelay: scrolled ? "100ms" : "0ms",
        }}
        className="sticky top-16 z-40 -mx-4 px-4 md:-mx-8 md:px-8 mb-4"
      >
        <div className="bg-white rounded-xl shadow-md border border-gray-100 px-4 py-2.5 md:py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
              {answeredCount}/{totalQuestions}
            </span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs md:text-sm font-semibold text-indigo-600 whitespace-nowrap">
              {percent}%
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Assessment;