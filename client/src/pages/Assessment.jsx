/**
 * Assessment Page
 * ---------------
 * Main self-assessment questionnaire — now with live answer saving.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import toast from "react-hot-toast";

import api from "../api/axios";
import ProgressBar from "../components/ProgressBar";
import CategorySection from "../components/CategorySection";
import LoadingSpinner from "../components/LoadingSpinner";

function Assessment() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false); 

  useEffect(() => {
    const load = async () => {
      try {
        const [questionsRes, startRes] = await Promise.all([
          api.get("/questions"),
          api.post("/assessments/start"),
        ]);

        setCategories(questionsRes.data.data.categories);

        const started = startRes.data.data.assessment;
        setAssessmentId(started._id);
        setAnswers(started.answers || {});
      } catch (err) {
        setError(err.message);
        toast.error("Could not load assessment");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Called by QuestionCard after a successful save
  const handleAnswerSaved = (questionId, payload) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...payload,
        answeredAt: new Date().toISOString(),
      },
    }));
  };

  // Called by QuestionCard after a successful clear
  const handleAnswerCleared = (questionId) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };
  // Submit the assessment
  const handleSubmit = async () => {
    if (!assessmentId) return;
    if (answeredCount < totalQuestions) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/assessments/${assessmentId}/submit`);
      toast.success("Assessment submitted! 🎉");

      // Small delay for toast to show, then navigate to results
      setTimeout(() => {
        navigate(`/results/${res.data.data.assessment._id}`);
      }, 500);
    } catch (err) {
      toast.error(err.message);
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
    <section className="flex-1 p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Sticky header with progress */}
        <div className="sticky top-16 z-40 bg-gray-50 pb-4 mb-4 -mx-4 px-4 md:-mx-8 md:px-8 pt-4">
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
                className="text-sm text-gray-600 hover:text-indigo-600 transition self-start sm:self-center"
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

        {/* Submit placeholder */}
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
  );
}

export default Assessment;