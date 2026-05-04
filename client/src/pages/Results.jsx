/**
 * Results Page
 * ------------
 * Shows the user's capability report after submitting an assessment.
 *
 * Components:
 *   - Hero header with submission date
 *   - Overall score + level badge
 *   - Capability heatmap (radar chart)
 *   - Strength / growth area insights
 *   - Per-category score cards
 *   - Certificate download button
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "../utils/toast";

import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import CapabilityHeatmap from "../components/CapabilityHeatmap";
import CategoryScoreCard from "../components/CategoryScoreCard";
import ResultsSummary from "../components/ResultsSummary";

// Level metadata
const LEVEL_META = {
  Emerging:   { emoji: "🌱", color: "text-teal-700",   bg: "bg-teal-50",   badge: "bg-teal-100 text-teal-800" },
  Developing: { emoji: "🌿", color: "text-green-700",  bg: "bg-green-50",  badge: "bg-green-100 text-green-800" },
  Confident:  { emoji: "🌳", color: "text-indigo-700", bg: "bg-indigo-50", badge: "bg-indigo-100 text-indigo-800" },
  Advanced:   { emoji: "🏆", color: "text-purple-700", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-800" },
};

function Results() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get assessment AND category metadata in parallel
        const [assessmentRes, questionsRes] = await Promise.all([
          api.get(`/assessments/${id}`),
          api.get("/questions"),
        ]);
        setAssessment(assessmentRes.data.data.assessment);
        setCategories(questionsRes.data.data.categories);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownloadCertificate = async () => {
    setDownloading(true);
    try {
      const response = await api.get(
        `/assessments/${assessment._id}/certificate`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CareAble_Certificate_${assessment.certificateId || assessment.level}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Certificate downloaded! 🏅");
    } catch (err) {
      toast.error(err.message || "Could not download certificate");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your results..." />;

  if (!assessment) {
    return (
      <section className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="text-center">
          <p className="text-red-600 mb-4">Assessment not found</p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    );
  }

  if (assessment.status !== "submitted") {
    return (
      <section className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="text-center max-w-md">
          <p className="text-gray-700 mb-4">
            This assessment hasn't been submitted yet.
          </p>
          <Link
            to="/assessment"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Continue assessment
          </Link>
        </div>
      </section>
    );
  }

  const meta = LEVEL_META[assessment.level] || LEVEL_META.Emerging;
  const submittedDate = new Date(assessment.submittedAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="flex-1 p-4 md:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 md:p-10 text-white mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-indigo-200 text-sm mb-1">
                Submitted {submittedDate}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Your Caregiving Capability Report
              </h1>
              <p className="text-indigo-100 max-w-xl">
                Here's how your informal caregiving skills align with the
                Australian Skills Classification.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="text-sm px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition whitespace-nowrap backdrop-blur"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Score + Level */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-2">
                Overall Capability Score
              </p>
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className="text-6xl md:text-7xl font-bold text-gray-900">
                  {assessment.overallScore}
                </span>
                <span className="text-2xl text-gray-400">/ 100</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Based on {Object.keys(assessment.categoryScores || {}).length} capability areas
              </p>
            </div>

            <div className={`${meta.bg} rounded-xl p-6 text-center border-2 border-white shadow-inner`}>
              <div className="text-6xl mb-2">{meta.emoji}</div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                Your Level
              </p>
              <p className={`text-2xl md:text-3xl font-bold ${meta.color}`}>
                {assessment.level}
              </p>
            </div>
          </div>
        </div>

        {/* Capability Heatmap */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Capability Heatmap
            </h2>
            <p className="text-sm text-gray-500">
              Your strengths across {categories.length} capability areas. Hover for details.
            </p>
          </div>

          <CapabilityHeatmap
            categoryScores={assessment.categoryScores || {}}
            categoryMeta={categories}
          />
        </div>

        {/* Strengths & Growth Areas */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Insights
          </h2>
          <ResultsSummary
            categoryScores={assessment.categoryScores || {}}
            categoryMeta={categories}
          />
        </div>

        {/* Individual category cards */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Detailed Breakdown
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <CategoryScoreCard
                key={cat.key}
                category={cat}
                score={assessment.categoryScores?.[cat.key] || 0}
              />
            ))}
          </div>
        </div>

        {/* Certificate CTA */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 md:p-10 text-white text-center">
          <span className="text-4xl mb-2 inline-block">🏅</span>
          <h3 className="text-2xl font-bold mb-2">Your Digital Certificate</h3>
          <p className="text-indigo-100 mb-6 max-w-lg mx-auto">
            A professional PDF certificate recognising your caregiving capabilities,
            aligned with the Australian Skills Classification.
          </p>
          <button
            onClick={handleDownloadCertificate}
            disabled={downloading}
            className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 disabled:bg-white/70 disabled:cursor-not-allowed transition shadow-md inline-flex items-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Preparing your certificate...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Certificate (PDF)
              </>
            )}
          </button>
        </div>

        <div className="text-center mt-6 pt-4">
          <Link
            to="/dashboard"
            className="text-sm text-gray-500 hover:text-indigo-600 transition"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Results;