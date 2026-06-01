// client/src/pages/Dashboard.jsx

/**
 * Dashboard — User's home base (v4 — inline emoji + taller action chips)
 * ----------------------------------------------------------------
 * Changes from v3:
 *  - PrimaryActionCard: emoji now inline with title text
 *  - Bottom chips (View Results / Certificate): taller flex-col cards
 *  - CTA card: removed min-h so it naturally matches HeroCard height
 *  - Locked state: same inline emoji treatment
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "../utils/toast";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import { relativeTime, shortDate } from "../utils/formatDate";
import CooldownBanner from "../components/CooldownBanner";

const LEVEL_META = {
  Support:  { emoji: "🌱", badge: "bg-amber-100 text-amber-800",    border: "border-l-amber-400",   ring: "#f59e0b", label: "Support",  description: "Building your foundation" },
  Growth:   { emoji: "🌿", badge: "bg-indigo-100 text-indigo-800",  border: "border-l-indigo-400",  ring: "#6366f1", label: "Growth",   description: "Developing your capabilities" },
  Strength: { emoji: "🏆", badge: "bg-emerald-100 text-emerald-800", border: "border-l-emerald-400", ring: "#10b981", label: "Strength", description: "Recognised caregiver capability" },
};

// ── Main component ─────────────────────────────────────────────────
function Dashboard() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [cooldown, setCooldown]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState(false);
  const hasLoadedOnce = useRef(false);

  const fetchAssessments = useCallback(async ({ silent = false } = {}) => {
    try {
      const res = await api.get("/assessments");
      const unique = Array.from(
        new Map(res.data.data.assessments.map((a) => [a._id, a])).values()
      );
      setAssessments(unique);
    } catch {
      if (!silent) toast.error("Could not load your history");
    }
  }, []);

  const fetchCooldown = useCallback(async () => {
    try {
      const res = await api.get("/assessments/cooldown-status");
      setCooldown(res.data.data.cooldown);
    } catch {/* silent */}
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      await Promise.all([fetchAssessments(), fetchCooldown()]);
      if (!cancelled) {
        setLoading(false);
        hasLoadedOnce.current = true;
      }
    };
    init();

    const handleFocus = () => {
      if (hasLoadedOnce.current) {
        fetchAssessments({ silent: true });
        fetchCooldown();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchAssessments, fetchCooldown]);

  const handleDownloadCertificate = async (assessmentId, certificateId, level) => {
    setDownloading(true);
    try {
      const response = await api.get(`/assessments/${assessmentId}/certificate`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href  = url;
      link.download = `CareAble_Certificate_${certificateId || level || "result"}.pdf`;
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

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  const submitted  = assessments.filter((a) => a.status === "submitted");
  const inProgress = assessments.find((a) => a.status === "in-progress");
  const latest     = submitted[0];
  const isLocked   = cooldown?.active && !inProgress;

  const inProgressTotal    = inProgress?.questionTotal ?? 36;
  const inProgressAnswered = inProgress?.answerCount ?? 0;
  const inProgressExpiryText = formatExpiryText(inProgress?.expiresAt);

  const topAreas = latest?.categoryScores
    ? Object.entries(latest.categoryScores)
        .filter(([, score]) => score >= 4.0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : [];

  const aiResources = (() => {
    if (!latest?._id) return null;
    try {
      const saved = localStorage.getItem(`ai-insights-${latest._id}`);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed?.resources) && parsed.resources.length > 0 ? parsed.resources : null;
    } catch {
      return null;
    }
  })();

  const avgScore  = submitted.length > 0
    ? (submitted.reduce((sum, a) => sum + (a.overallScore ?? 0), 0) / submitted.length).toFixed(2)
    : null;
  const bestScore = submitted.length > 0 ? Math.max(...submitted.map((a) => a.overallScore ?? 0)) : null;

  return (
    <section className="flex-1 bg-gradient-to-b from-stone-50 via-white to-stone-50 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-5">

        {isLocked && <CooldownBanner cooldown={cooldown} />}

        {/* ROW 1 */}
        <div className="grid lg:grid-cols-5 gap-4 lg:items-stretch">
          <div className="lg:col-span-3 min-w-0">
            <HeroCard user={user} latest={latest} inProgress={inProgress} />
          </div>
          <div className="lg:col-span-2 min-w-0">
            <PrimaryActionCard
              inProgress={inProgress}
              latest={latest}
              isLocked={isLocked}
              cooldown={cooldown}
              inProgressTotal={inProgressTotal}
              inProgressAnswered={inProgressAnswered}
              inProgressExpiryText={inProgressExpiryText}
              downloading={downloading}
              onDownload={handleDownloadCertificate}
            />
          </div>
        </div>

        {/* ROW 2 */}
        {submitted.length > 0 && (
          <StatStrip
            submitted={submitted}
            avgScore={avgScore}
            bestScore={bestScore}
            topAreas={topAreas}
          />
        )}

        {/* ROW 3 */}
        {latest && (
          <TopAreasCard topAreas={topAreas} categoryScores={latest.categoryScores} />
        )}

        {/* ROW 4 */}
        {aiResources && (
          <AiResourcesCard resources={aiResources} assessmentId={latest._id} />
        )}

        {/* ROW 5 */}
        <HistorySection
          assessments={assessments}
          onDelete={() => fetchAssessments({ silent: true })}
        />
      </div>
    </section>
  );
}

// ── HERO CARD ──────────────────────────────────────────────────────
function HeroCard({ user, latest, inProgress }) {
  const firstName = user?.name?.split(" ")[0] || "friend";
  const level     = latest?.level;
  const meta      = level ? LEVEL_META[level] : null;
  const initials  = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const tagline = inProgress
    ? "Your assessment is waiting — pick up where you left off."
    : latest
    ? "Your caregiving skills are documented and recognised."
    : "Start your first assessment to discover your caregiver profile.";

  return (
    <div className="relative h-full overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)" }}
      />

      <div className="relative flex flex-col h-full gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {meta ? (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
                  {meta.emoji} {meta.label} Level
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  ✨ New Carer
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-sm md:text-base text-stone-500 mt-1 line-clamp-2">{tagline}</p>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0">
            {initials}
          </div>
        </div>

        {latest ? (
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <ScoreRingInline score={latest.overallScore ?? 0} level={latest.level} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-1">Latest Score</p>
              <p className="text-3xl md:text-4xl font-bold text-stone-900 leading-none">
                {(latest.overallScore ?? 0).toFixed(2)}
                <span className="text-sm text-gray-400 font-normal ml-1">/ 5.00</span>
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {meta?.emoji} {meta?.label} · {meta?.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 border-t border-gray-100">
            <p className="text-sm text-gray-400 italic">Take your first assessment to see your score here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SCORE RING ─────────────────────────────────────────────────────
function ScoreRingInline({ score, level }) {
  const meta   = LEVEL_META[level] ?? LEVEL_META.Growth;
  const size   = 80;
  const stroke = 7;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const progress   = Math.max(0, Math.min(1, (score - 1) / 4));
  const dashOffset = circ * (1 - progress);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={meta.ring} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg">{meta.emoji}</span>
      </div>
    </div>
  );
}

// ── PRIMARY ACTION CARD ────────────────────────────────────────────
function PrimaryActionCard({ inProgress, latest, isLocked, cooldown, inProgressTotal, inProgressAnswered, inProgressExpiryText, downloading, onDownload }) {
  let mainCta = null;

  if (isLocked) {
    mainCta = {
      type: "locked",
      title: "Retake locked",
      sub: `Available in ${cooldown?.daysRemaining ?? "?"} day${cooldown?.daysRemaining === 1 ? "" : "s"}`,
      icon: "🔒",
    };
  } else if (inProgress) {
    mainCta = {
      type: "link",
      to: "/assessment",
      title: "Continue Assessment",
      sub: `${inProgressAnswered} of ${inProgressTotal} answered${inProgressExpiryText ? ` · ${inProgressExpiryText}` : ""}`,
      icon: "⏳",
      progress: inProgressTotal > 0 ? (inProgressAnswered / inProgressTotal) * 100 : 0,
    };
  } else if (latest) {
    mainCta = {
      type: "link",
      to: "/assessment",
      title: "Retake Assessment",
      sub: "Take a fresh assessment",
      icon: "🔄",
    };
  } else {
    mainCta = {
      type: "link",
      to: "/assessment",
      title: "Start Assessment",
      sub: "Discover your caregiver profile",
      icon: "▶",
    };
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* ── MAIN CTA ── */}
      {mainCta.type === "locked" ? (
        <div className="flex-1 bg-gray-100 border border-gray-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none flex-shrink-0">{mainCta.icon}</span>
              <p className="font-bold text-stone-800 text-lg truncate">{mainCta.title}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">{mainCta.sub}</p>
          </div>
          <p className="text-xs text-gray-400 mt-3">This helps keep your results meaningful</p>
        </div>
      ) : (
        <Link
          to={mainCta.to}
          className="group flex-1 relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl p-5 flex flex-col justify-between hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg"
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none flex-shrink-0">{mainCta.icon}</span>
              <p className="font-bold text-white text-lg truncate">{mainCta.title}</p>
            </div>
            <p className="text-sm text-indigo-100 mt-1.5 truncate">{mainCta.sub}</p>
            {mainCta.progress !== undefined && (
              <div className="mt-3 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${mainCta.progress}%` }}
                />
              </div>
            )}
          </div>
          <span className="text-white text-xs group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 self-end mt-2">
            Open <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </span>
        </Link>
      )}

      {/* ── BOTTOM CHIPS — taller flex-col cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {latest ? (
          <Link
            to={`/results/${latest._id}`}
            className="group bg-white border border-gray-100 rounded-xl px-4 py-4 hover:border-indigo-200 hover:shadow-sm transition-all overflow-hidden flex flex-col gap-1.5"
          >
            <span className="text-2xl leading-none">📊</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">View Results</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {latest.overallScore?.toFixed(2)} · {latest.level}
              </p>
            </div>
            <span className="text-xs text-gray-300 group-hover:text-indigo-400 transition-colors mt-auto">
              Open →
            </span>
          </Link>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-4 opacity-50 overflow-hidden flex flex-col gap-1.5">
            <span className="text-2xl leading-none">📊</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-600 truncate">View Results</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">After your first</p>
            </div>
          </div>
        )}

        {latest ? (
          <button
            onClick={() => onDownload(latest._id, latest.certificateId, latest.level)}
            disabled={downloading}
            className="group bg-white border border-gray-100 rounded-xl px-4 py-4 hover:border-emerald-200 hover:shadow-sm transition-all text-left disabled:opacity-60 disabled:cursor-wait overflow-hidden w-full flex flex-col gap-1.5"
          >
            <span className="text-2xl leading-none">{downloading ? "⏳" : "🏅"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {downloading ? "Preparing…" : "Certificate"}
              </p>
              <p className="text-xs text-emerald-600 truncate font-medium mt-0.5">
                {downloading ? "Just a moment" : "Download PDF →"}
              </p>
            </div>
            {!downloading && (
              <span className="text-xs text-gray-300 group-hover:text-emerald-500 transition-colors mt-auto">
                PDF →
              </span>
            )}
          </button>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-4 opacity-50 overflow-hidden flex flex-col gap-1.5">
            <span className="text-2xl leading-none">🏅</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-600 truncate">Certificate</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">After your first</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── STAT STRIP ─────────────────────────────────────────────────────
function StatStrip({ submitted, avgScore, bestScore, topAreas }) {
  const topAreaName = topAreas[0] ? formatCategoryKey(topAreas[0][0]) : "—";

  const stats = [
    { label: "Assessments", value: submitted.length,             color: "text-indigo-600" },
    { label: "Avg Score",   value: avgScore ?? "—",              color: "text-purple-600" },
    { label: "Best Score",  value: bestScore?.toFixed(2) ?? "—", color: "text-emerald-600" },
    { label: "Top Domain",  value: topAreaName,                  color: "text-amber-600",  small: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 overflow-hidden min-w-0">
          <p className="text-sm font-medium text-stone-400 mb-0.5 uppercase tracking-wide truncate">{s.label}</p>
          <p className={`font-bold leading-tight truncate ${
            s.small
              ? "text-sm"
              : "text-2xl md:text-3xl"
          } ${s.color}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── TOP AREAS CARD ─────────────────────────────────────────────────
function TopAreasCard({ topAreas, categoryScores }) {
  const allScored = categoryScores
    ? Object.entries(categoryScores).filter(([, s]) => s != null).sort(([, a], [, b]) => b - a)
    : [];
  const belowStrength = allScored.filter(([, s]) => s < 4.0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900">Top Capability Areas</h2>
          <p className="text-xs text-gray-400">Domains scored 4.0 or above</p>
        </div>
        <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
          {topAreas.length} {topAreas.length === 1 ? "strength" : "strengths"}
        </span>
      </div>

      {topAreas.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-2">No domains scored ≥ 4.0 yet — keep building.</p>
      ) : (
        <div className="space-y-1.5">
          {topAreas.map(([key, score]) => (
            <div key={key} className="flex items-center justify-between gap-3 overflow-hidden">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-medium text-emerald-800 min-w-0 flex-1 overflow-hidden">
                <span className="flex-shrink-0">🏅</span>
                <span className="truncate">{formatCategoryKey(key)}</span>
              </span>
              <span className="text-xs font-bold text-emerald-700 flex-shrink-0">{score.toFixed(2)}</span>
            </div>
          ))}
          {belowStrength.length > 0 && (
            <p className="text-xs text-gray-400 pt-1.5">
              +{belowStrength.length} other domain{belowStrength.length !== 1 ? "s" : ""} scored below 4.0
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI RESOURCES CARD ──────────────────────────────────────────────
function AiResourcesCard({ resources, assessmentId }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">📚</span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900">Recommended Resources</h2>
            <p className="text-xs text-gray-400 truncate">From your AI Insights · tailored to your profile</p>
          </div>
        </div>
        <Link
          to={`/results/${assessmentId}`}
          onClick={() => sessionStorage.setItem("results-tab", "ai-insights")}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition whitespace-nowrap flex-shrink-0"
        >
          View all →
        </Link>
      </div>

      <div className="divide-y divide-gray-50">
        {resources.map((r, i) => {
          const searchQuery = encodeURIComponent(`${r.organisation} ${r.program} Australia`);
          const searchUrl   = `https://www.google.com/search?q=${searchQuery}`;
          return (
            <a key={i} href={searchUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 px-5 py-3 hover:bg-indigo-50 transition group">
              <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0 group-hover:bg-indigo-200 transition">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition truncate">
                    {r.program || r.title}
                  </p>
                  {r.type && (
                    <span className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{r.type}</span>
                  )}
                </div>
                {r.organisation && (
                  <p className="text-xs font-medium text-indigo-600 mt-0.5 truncate">{r.organisation}</p>
                )}
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{r.description}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── HISTORY SECTION ────────────────────────────────────────────────
function HistorySection({ assessments, onDelete }) {
  if (assessments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-50 flex items-center justify-center">
          <span className="text-xl">📋</span>
        </div>
        <p className="text-sm text-gray-700 font-semibold">No assessments yet</p>
        <p className="text-xs text-gray-400 mt-1">Start your first assessment to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Assessment History</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {assessments.length} {assessments.length === 1 ? "record" : "records"}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {assessments.map((a, idx) => (
          <HistoryCard
            key={a._id}
            assessment={a}
            isLatest={idx === 0 && a.status === "submitted"}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryCard({ assessment, isLatest, onDelete }) {
  const isSubmitted = assessment.status === "submitted";
  const meta        = isSubmitted ? (LEVEL_META[assessment.level] ?? null) : null;
  const dateSource  = assessment.submittedAt || assessment.updatedAt;
  const total       = assessment.questionTotal ?? 36;

  const handleDiscard = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Discard this in-progress assessment? Your answers will be lost.")) return;
    try {
      await api.delete(`/assessments/${assessment._id}`);
      toast.success("Assessment discarded.");
      onDelete?.();
    } catch (err) {
      toast.error(err.message || "Could not discard");
    }
  };

  return (
    <div className={`flex items-stretch group border-l-4 overflow-hidden ${meta ? meta.border : "border-l-gray-200"} hover:bg-gray-50 transition-colors`}>
      <Link to={isSubmitted ? `/results/${assessment._id}` : "/assessment"} className="flex-1 px-4 py-3 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-lg flex-shrink-0">{isSubmitted ? (meta?.emoji ?? "📋") : "⏳"}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold text-gray-900">{shortDate(dateSource)}</p>
                {isLatest && (
                  <span className="text-xs font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-full uppercase tracking-wide flex-shrink-0">Latest</span>
                )}
                {isSubmitted && meta && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${meta.badge}`}>{meta.label}</span>
                )}
                {!isSubmitted && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">In progress</span>
                )}
              </div>
              {isSubmitted ? (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  Score <span className="font-semibold text-gray-600">{assessment.overallScore?.toFixed(2) ?? "—"} / 5.00</span>
                  {assessment.certificateId && (
                    <><span className="mx-1">·</span>
                    <span className="font-mono">{assessment.certificateId}</span></>
                  )}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {assessment.answerCount ?? 0} of {total} answered · {relativeTime(dateSource)}
                </p>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-300 flex-shrink-0 group-hover:text-indigo-400 transition-colors whitespace-nowrap">
            {isSubmitted ? "View →" : "Continue →"}
          </span>
        </div>
      </Link>

      {!isSubmitted && (
        <div className="flex items-center pr-3 flex-shrink-0">
          <button onClick={handleDiscard} title="Discard this assessment"
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Utility ────────────────────────────────────────────────────────
function formatCategoryKey(key) {
  if (!key) return "";
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatExpiryText(expiresAt) {
  if (!expiresAt) return "";
  const msRemaining = new Date(expiresAt).getTime() - Date.now();
  if (msRemaining <= 0) return "expires soon";

  const dayMs = 24 * 60 * 60 * 1000;
  if (msRemaining >= dayMs) {
    const days = Math.ceil(msRemaining / dayMs);
    return `expires in ${days} day${days === 1 ? "" : "s"}`;
  }

  const hours = Math.ceil(msRemaining / (60 * 60 * 1000));
  return `expires in ${hours} hour${hours === 1 ? "" : "s"}`;
}

export default Dashboard;
