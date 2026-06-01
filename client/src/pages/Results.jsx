// client/src/pages/Results.jsx

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "../utils/toast";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import CapabilityHeatmap from "../components/CapabilityHeatmap";
import ResultsSummary from "../components/ResultsSummary";

const LEVEL_META = {
  Support:  { emoji: "🌱", color: "text-amber-600",   bg: "bg-amber-50",   description: "Additional support and resources can help strengthen these capabilities." },
  Growth:   { emoji: "🌿", color: "text-indigo-600",  bg: "bg-indigo-50",  description: "You are developing strong caregiving capabilities with room to grow further." },
  Strength: { emoji: "🏆", color: "text-emerald-600", bg: "bg-emerald-50", description: "You demonstrate strong, well-developed caregiving capabilities." },
};

const TABS = [
  { key: "overview",    label: "Overview",    icon: "📋" },
  { key: "breakdown",   label: "Breakdown",   icon: "📊" },
  { key: "ai-insights", label: "AI Insights", icon: "✨" },
  { key: "certificate", label: "Certificate", icon: "🏅" },
];

function Results() {
  const { id } = useParams();
  const [assessment, setAssessment]   = useState(null);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab]     = useState("overview");

  const storageKey = `ai-insights-${id}`;
  const [insights, setInsights]     = useState(() => {
    try {
      const saved = localStorage.getItem(`ai-insights-${id}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState(null);

  const generateInsights = async (isRegenerate = false) => {
    if (isRegenerate) {
      localStorage.removeItem(storageKey);
      setInsights(null);
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res  = await api.post("/ai/insights", { assessmentId: id });
      const data = res.data.data.insights;
      setInsights(data);
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        // localStorage full — non-blocking
      }
    } catch (err) {
      setAiError(err.message || "Could not generate insights. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessmentRes, questionsRes] = await Promise.all([
          api.get("/assessments/" + id),
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
      const response = await api.get("/assessments/" + assessment._id + "/certificate", { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href  = url;
      link.download = "CareAble_Certificate_" + (assessment.certificateId || assessment.level) + ".pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Certificate downloaded!");
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
          <Link to="/dashboard" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">Back to dashboard</Link>
        </div>
      </section>
    );
  }

  if (assessment.status !== "submitted") {
    return (
      <section className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="text-center max-w-md">
          <p className="text-gray-700 mb-4">This assessment has not been submitted yet.</p>
          <Link to="/assessment" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">Continue assessment</Link>
        </div>
      </section>
    );
  }

  const meta          = LEVEL_META[assessment.level] || LEVEL_META.Growth;
  const submittedDate = new Date(assessment.submittedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  const topAreas      = categories
    .filter((cat) => (assessment.categoryScores?.[cat.key] || 0) >= 4.0)
    .sort((a, b) => (assessment.categoryScores?.[b.key] || 0) - (assessment.categoryScores?.[a.key] || 0));
  const areaCount = Object.values(assessment.categoryScores || {}).filter((v) => v != null).length;

  return (
    <section className="flex-1 bg-gray-50 min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="relative max-w-5xl mx-auto px-4 pt-5 pb-6">

          {/* Title row — date left, dashboard button right */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-indigo-300 text-xs mb-1">Submitted {submittedDate}</p>
              <h1 className="text-2xl md:text-3xl font-bold leading-snug">Caregiving Capability Report</h1>
            </div>
            <Link
              to="/dashboard"
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-black/20 hover:bg-black/30 rounded-lg transition border border-white/10 whitespace-nowrap text-white/80"
            >
              ← Dashboard
            </Link>
          </div>

          {/* Stats card */}
          <div className="bg-black/20 rounded-xl px-4 py-4 border border-white/10">

            {/* ── Mobile layout: 3-col top row + description below ── */}
            {/*    Score (left) · Areas (centre) · Level (right)       */}
            <div className="sm:hidden">
              <div className="grid grid-cols-3 items-center mb-3">
                {/* Score */}
                <div>
                  <span className="text-2xl font-bold leading-none">
                    {assessment.overallScore != null ? assessment.overallScore.toFixed(2) : "—"}
                  </span>
                  <span className="text-xs text-indigo-300 ml-1">/ 5.00</span>
                </div>

                {/* Areas — centred */}
                <div className="text-center">
                  <p className="text-sm font-semibold leading-none">{areaCount}</p>
                  <p className="text-xs text-indigo-300 mt-0.5">areas</p>
                </div>

                {/* Level — right-aligned */}
                <div className="text-right">
                  <p className="text-xs text-indigo-300 uppercase tracking-wider mb-0.5">Level</p>
                  <p className="font-bold text-sm leading-none">{meta.emoji} {assessment.level}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-indigo-100 leading-relaxed border-t border-white/10 pt-3">
                {meta.description}
              </p>
            </div>

            {/* ── Desktop layout: single flex row ───────────────── */}
            <div className="hidden sm:flex sm:items-center sm:gap-4">
              <div className="pr-4 border-r border-white/15 flex-shrink-0">
                <p className="text-2xl font-bold leading-none">
                  {assessment.overallScore != null ? assessment.overallScore.toFixed(2) : "—"}
                </p>
                <p className="text-xs text-indigo-300 mt-1">/ 5.00</p>
              </div>
              <div className="pr-4 border-r border-white/15 flex-shrink-0">
                <p className="text-xs text-indigo-300 mb-0.5 uppercase tracking-wide">Level</p>
                <p className="font-bold text-base">{meta.emoji} {assessment.level}</p>
              </div>
              <p className="text-sm text-indigo-100 flex-1 leading-relaxed">{meta.description}</p>
              <p className="text-xs text-indigo-300 ml-auto flex-shrink-0">{areaCount} areas</p>
            </div>

          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-2 sm:px-4">
          <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={"flex items-center gap-1.5 px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150 " + (activeTab === tab.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800")}>
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.key === "ai-insights" && insights && !aiLoading && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {topAreas.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Top Capability Areas</p>
                <div className="flex flex-wrap gap-2">
                  {topAreas.map((cat) => (
                    <span key={cat.key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-800">
                      {cat.icon && <span>{cat.icon}</span>}
                      <span>{cat.label}</span>
                      <span className="text-emerald-500 font-normal">{(assessment.categoryScores?.[cat.key] || 0).toFixed(2)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Insights</p>
              <ResultsSummary categoryScores={assessment.categoryScores || {}} categoryMeta={categories} />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Capability Heatmap</p>
              <p className="text-sm text-gray-400 mb-4">Switch views to explore your {categories.length} capability areas</p>
              <CapabilityHeatmap categoryScores={assessment.categoryScores || {}} categoryMeta={categories} />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🏅</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Download your certificate</p>
                    <p className="text-xs text-gray-500">PDF · {meta.emoji} {assessment.level} level</p>
                  </div>
                </div>
                <button onClick={handleDownloadCertificate} disabled={downloading}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition">
                  {downloading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  )}
                  {downloading ? "Preparing..." : "Download"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BREAKDOWN */}
        {activeTab === "breakdown" && (
          <div>
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Detailed Breakdown</p>
              <p className="text-sm text-gray-400 mt-0.5">Score and tier for each of your {categories.length} capability domains</p>
            </div>
            <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {categories.map((cat) => (
                <CompactScoreCard key={cat.key} category={cat} score={assessment.categoryScores?.[cat.key] ?? null} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "ai-insights" && (
          <AiInsightsTab
            insights={insights}
            loading={aiLoading}
            error={aiError}
            onGenerate={generateInsights}
          />
        )}

        {/* CERTIFICATE */}
        {activeTab === "certificate" && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-6 text-center text-white">
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                />
                <div className="text-4xl mb-2">🏅</div>
                <h2 className="text-lg font-bold mb-0.5">Your Digital Certificate</h2>
                <p className="text-indigo-200 text-xs">{meta.emoji} {assessment.level} Level</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Overall Score", value: (assessment.overallScore?.toFixed(2) || "—") + " / 5.00" },
                    { label: "Level",         value: meta.emoji + " " + assessment.level },
                    { label: "Submitted",     value: submittedDate },
                    ...(assessment.certificateId ? [{ label: "Certificate ID", value: assessment.certificateId, mono: true }] : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-500 text-xs">{row.label}</span>
                      <span className={"font-medium text-gray-900 text-xs " + (row.mono ? "font-mono" : "")}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleDownloadCertificate} disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition">
                  {downloading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Preparing...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download Certificate (PDF)</>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400">Aligned with the Australian Skills Classification</p>
              </div>
            </div>
            <p className="text-center mt-4">
              <Link to="/dashboard" className="text-xs text-gray-400 hover:text-indigo-600 transition">← Back to dashboard</Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── AI Insights tab ────────────────────────────────────────────────
function AiInsightsTab({ insights, loading, error, onGenerate }) {

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">Analysing your results…</p>
          <p className="text-xs text-gray-400 mt-1">ChatGPT is reading your capability profile</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
              ✨
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">AI-Powered Insights</p>
              <p className="text-xs text-indigo-600">Personalised feedback powered by ChatGPT</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Get personalised feedback based on your exact capability scores — including
            tailored resources, a summary of your strengths, and one clear next step.
          </p>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <button
            onClick={() => onGenerate(false)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <span>✨</span>
            Generate My Insights
          </button>
          <p className="text-xs text-gray-400 mt-3">Takes 5–10 seconds · Results are personalised to your scores</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What you'll get</p>
          <div className="space-y-3">
            {[
              { icon: "💬", label: "Personal summary",     desc: "A warm overview of what your scores say about you as a carer." },
              { icon: "💪", label: "Strengths spotlight",  desc: "Recognition of the domains where you're excelling." },
              { icon: "🌱", label: "Growth guidance",      desc: "Constructive, encouraging focus on your development areas." },
              { icon: "📚", label: "Australian resources", desc: "3 real, relevant programs and services tailored to your profile." },
              { icon: "🎯", label: "Next step",            desc: "One clear action you can take this week." },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💬</span>
          <p className="text-sm font-bold text-gray-900">Your Summary</p>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{insights.summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💪</span>
            <p className="text-sm font-bold text-emerald-800">Your Strengths</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{insights.strengths}</p>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🌱</span>
            <p className="text-sm font-bold text-amber-800">Growth Opportunities</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{insights.growth}</p>
        </div>
      </div>

      {Array.isArray(insights.resources) && insights.resources.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📚</span>
            <p className="text-sm font-bold text-gray-900">Recommended Resources</p>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Tap any resource to search and find the latest information online.
          </p>
          <div className="space-y-3">
            {insights.resources.map((r, i) => {
              const searchQuery = encodeURIComponent(`${r.organisation} ${r.program} Australia`);
              const searchUrl   = `https://www.google.com/search?q=${searchQuery}`;
              return (
                <a key={i} href={searchUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition group">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0 group-hover:bg-indigo-200 transition">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition">
                        {r.program}
                      </p>
                      {r.type && (
                        <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          {r.type}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-indigo-600 mt-0.5">{r.organisation}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.description}</p>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search Google for this resource →
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {insights.nextStep && (
        <div className="bg-indigo-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🎯</span>
            <p className="text-sm font-bold">Your Next Step</p>
          </div>
          <p className="text-sm leading-relaxed text-indigo-100">{insights.nextStep}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-400">Generated by ChatGPT · Results may vary</p>
        <button
          onClick={() => onGenerate(true)}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerate
        </button>
      </div>
    </div>
  );
}

// ── CompactScoreCard ───────────────────────────────────────────────
function CompactScoreCard({ category, score }) {
  const [expanded, setExpanded] = useState(false);
  const hasScore  = score != null && score > 0;
  const tier      = !hasScore ? null : score >= 4.0 ? "Strength" : score >= 3.0 ? "Growth" : "Support";
  const tierColor = tier === "Strength" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : tier === "Growth" ? "text-indigo-700 bg-indigo-50 border-indigo-200" : "text-amber-700 bg-amber-50 border-amber-200";
  const barColor  = score >= 4.0 ? "#10b981" : score >= 3.0 ? "#6366f1" : score >= 2.0 ? "#f59e0b" : "#f43f5e";
  const barWidth  = hasScore ? Math.min(100, Math.max(0, ((score - 1) / 4) * 100)) : 0;

  return (
    <div className={"bg-white rounded-xl border shadow-sm transition-all duration-200 " + (expanded ? "border-indigo-200" : "border-gray-100")}>
      <button onClick={() => setExpanded(!expanded)} className="w-full p-3.5 text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-base flex-shrink-0">{category.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 truncate">{category.label}</p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {tier && <span className={"text-xs font-semibold px-1.5 py-0.5 rounded-full border " + tierColor}>{tier}</span>}
                <svg className={"w-3.5 h-3.5 text-gray-400 transition-transform duration-200 " + (expanded ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>
        {hasScore && (
          <div className="flex items-center gap-2 mt-2.5 pl-10">
            <span className="text-sm font-bold text-gray-900 w-8 flex-shrink-0">{score.toFixed(1)}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: barWidth + "%", backgroundColor: barColor }} />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">/ 5</span>
          </div>
        )}
      </button>
      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-gray-50">
          <p className="text-sm text-gray-500 leading-relaxed mt-2.5 mb-3">{category.description}</p>
          {hasScore && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Score",    value: score.toFixed(2) + " / 5" },
                { label: "Level",    value: tier },
                { label: "Standing", value: score >= 4.0 ? "Top 25%" : score >= 3.0 ? "Middle" : "Lower 25%" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">{stat.label}</p>
                  <p className="text-xs font-bold text-gray-800">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Results;
