/**
 * Dashboard — User's home base
 * ----------------------------
 * Shows:
 *   - Personalised welcome
 *   - Real-time stats (assessments, latest score, level)
 *   - Smart CTA (Start / Continue / Retake)
 *   - Assessment history list with discard option for in-progress
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import { relativeTime, shortDate } from "../utils/formatDate";

// Level metadata
const LEVEL_META = {
  Emerging:   { emoji: "🌱", badge: "bg-teal-100 text-teal-800" },
  Developing: { emoji: "🌿", badge: "bg-green-100 text-green-800" },
  Confident:  { emoji: "🌳", badge: "bg-indigo-100 text-indigo-800" },
  Advanced:   { emoji: "🏆", badge: "bg-purple-100 text-purple-800" },
};

function Dashboard() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track if the initial fetch has happened (avoids loading spinner on refetches)
  const hasLoadedOnce = useRef(false);

  // Pure async function — no setState side effects, just returns the data
  const fetchAssessments = useCallback(async ({ silent = false } = {}) => {
    try {
      const res = await api.get("/assessments");
      // Defensive deduplication by _id
      const unique = Array.from(
        new Map(res.data.data.assessments.map((a) => [a._id, a])).values()
      );
      setAssessments(unique);
    } catch (err) {
      if (!silent) toast.error("Could not load your history");
      console.error(err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await fetchAssessments();
      if (!cancelled) {
        setLoading(false);
        hasLoadedOnce.current = true;
      }
    };

    init();

    // Re-fetch when the tab regains focus (silent — no toast on focus failures)
    const handleFocus = () => {
      if (hasLoadedOnce.current) {
        fetchAssessments({ silent: true });
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchAssessments]);

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  // ---- Computed stats ----
  const submitted = assessments.filter((a) => a.status === "submitted");
  const inProgress = assessments.find((a) => a.status === "in-progress");
  const latest = submitted[0]; // newest first

  // CTA logic
  let ctaLabel = "Start Assessment";
  let ctaLink = "/assessment";
  if (inProgress) {
    ctaLabel = "Continue Assessment";
  } else if (latest) {
    ctaLabel = "Retake Assessment";
  }

  return (
    <section className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(" ")[0] || "friend"} 👋
          </h1>
          <p className="text-gray-500">
            Here's your caregiving journey at a glance.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard
            label="Completed Assessments"
            value={submitted.length}
            color="indigo"
          />
          <StatCard
            label="Latest Score"
            value={latest ? `${latest.overallScore}` : "—"}
            suffix={latest ? "/100" : "Take your first"}
            color="purple"
          />
          <StatCard
            label="Current Level"
            value={
              latest ? (
                <span className="inline-flex items-center gap-1">
                  <span className="text-3xl">{LEVEL_META[latest.level]?.emoji}</span>
                  <span>{latest.level}</span>
                </span>
              ) : (
                "—"
              )
            }
            color="pink"
          />
        </div>

        {/* Main CTA */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 md:p-10 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {inProgress
              ? "Your assessment is waiting"
              : latest
              ? "Keep your skills up to date"
              : "Ready to begin?"}
          </h2>
          <p className="text-indigo-100 mb-6 max-w-2xl">
            {inProgress
              ? `You've answered ${inProgress.answerCount ?? 0} of 30 questions so far. Pick up right where you left off.`
              : "Discover your caregiving strengths across 6 skill areas. The assessment takes about 10–15 minutes and saves automatically as you go."}
          </p>
          <Link
            to={ctaLink}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition shadow-lg hover:shadow-xl"
          >
            {ctaLabel}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          {latest && (
            <Link
              to={`/results/${latest._id}`}
              className="inline-block mt-3 ml-0 sm:ml-3 text-indigo-100 hover:text-white text-sm underline-offset-4 hover:underline"
            >
              View latest results →
            </Link>
          )}
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Your Assessment History
            </h2>
            <span className="text-sm text-gray-500">
              {assessments.length} {assessments.length === 1 ? "record" : "records"}
            </span>
          </div>

          {assessments.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-full mb-3">
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-gray-500">No assessments yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Start your first one to see it here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {assessments.map((a) => (
                <AssessmentRow
                  key={a._id}
                  assessment={a}
                  onDelete={() => fetchAssessments({ silent: true })}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

// ---- Stat card ----
function StatCard({ label, value, suffix, color }) {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-700",
    purple: "bg-purple-50 text-purple-700",
    pink: "bg-pink-50 text-pink-700",
  };

  return (
    <div className={`p-6 rounded-xl ${colorClasses[color]}`}>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
}

// ---- Single assessment row with discard option ----
function AssessmentRow({ assessment, onDelete }) {
  const isSubmitted = assessment.status === "submitted";
  const levelMeta = isSubmitted && LEVEL_META[assessment.level];

  const dateSource = assessment.submittedAt || assessment.updatedAt;

  const handleDiscard = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      "Discard this in-progress assessment? Your answers will be lost. (You can always start a new one.)"
    );
    if (!confirmed) return;

    try {
      await api.delete(`/assessments/${assessment._id}`);
      toast.success("Assessment discarded.");
      onDelete?.();
    } catch (err) {
      toast.error(err.message || "Could not discard");
    }
  };

  return (
    <li>
      <div className="flex items-center gap-2 group">
        <Link
          to={isSubmitted ? `/results/${assessment._id}` : "/assessment"}
          className="block flex-1 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition min-w-0"
        >
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="text-2xl flex-shrink-0">
                {isSubmitted ? levelMeta?.emoji : "⏳"}
              </div>
              <div className="min-w-0">
                <p className="text-gray-900 font-medium">
                  {isSubmitted ? "Submitted" : "In progress"} · {shortDate(dateSource)}
                </p>
                {isSubmitted ? (
                  <p className="text-sm text-gray-500">
                    Score:{" "}
                    <span className="font-semibold text-gray-700">
                      {assessment.overallScore}/100
                    </span>
                    <span className="mx-1.5 text-gray-300">·</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${levelMeta?.badge}`}
                    >
                      {assessment.level}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {assessment.answerCount ?? 0} of 30 answered · Updated {relativeTime(dateSource)}
                  </p>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-400 flex-shrink-0">
              {isSubmitted ? "View →" : "Continue →"}
            </div>
          </div>
        </Link>

        {/* Discard button — only for in-progress assessments */}
        {!isSubmitted && (
          <button
            onClick={handleDiscard}
            title="Discard this assessment"
            aria-label="Discard in-progress assessment"
            className="opacity-50 hover:opacity-100 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}

export default Dashboard;