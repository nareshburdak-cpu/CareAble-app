/**
 * Results Page — Temporary version
 * --------------------------------
 * Shows basic submission confirmation + scores.
 * Will be replaced with the full heatmap + certificate in Task 7.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

// Level → emoji + color
const LEVEL_META = {
  Emerging:   { emoji: "🌱", color: "text-teal-600",    bg: "bg-teal-50" },
  Developing: { emoji: "🌿", color: "text-green-600",   bg: "bg-green-50" },
  Confident:  { emoji: "🌳", color: "text-indigo-600",  bg: "bg-indigo-50" },
  Advanced:   { emoji: "🏆", color: "text-purple-600",  bg: "bg-purple-50" },
};

function Results() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadCertificate = async () => {
    setDownloading(true);
    try {
      const response = await api.get(
        `/assessments/${assessment._id}/certificate`,
        { responseType: "blob" }          // Important: tell axios to expect a file
      );

      // Create a temporary URL for the blob and click an invisible link
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CareAble_Certificate_${assessment.level}.pdf`;
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

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/assessments/${id}`);
        setAssessment(res.data.data.assessment);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

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

  const meta = LEVEL_META[assessment.level] || LEVEL_META.Emerging;

  return (
    <section className="flex-1 p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Hero card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Your Caregiving Capability Report
          </h1>
          <p className="text-gray-500">
            Submitted on{" "}
            {new Date(assessment.submittedAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Overall score + level */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 mb-6">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Score */}
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-1">
                Overall Score
              </p>
              <p className="text-6xl md:text-7xl font-bold text-gray-900">
                {assessment.overallScore}
                <span className="text-3xl text-gray-400">/100</span>
              </p>
            </div>

            {/* Level badge */}
            <div className={`${meta.bg} rounded-xl p-6 text-center`}>
              <div className="text-5xl mb-2">{meta.emoji}</div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                Your Level
              </p>
              <p className={`text-3xl font-bold ${meta.color}`}>
                {assessment.level}
              </p>
            </div>
          </div>
        </div>

        {/* Category breakdown (simple for now — full heatmap in Task 7) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Capability Breakdown
          </h2>
          <div className="space-y-4">
            {Object.entries(assessment.categoryScores || {}).map(([key, score]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 capitalize">
                    {key.replace(/-/g, " ")}
                  </span>
                  <span className="font-semibold text-gray-900">{score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon placeholder */}
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

      </div>
    </section>
  );
}

export default Results;