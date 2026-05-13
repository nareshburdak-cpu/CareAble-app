// client/src/pages/admin/Analytics.jsx

/**
 * Admin Analytics Dashboard
 * --------------------------
 * Mobile-fixed: responsive stat cards, scrollable charts, card-based
 * recent submissions on mobile instead of a table.
 *
 * Phase 12-A: scores are 1–5 floats.
 * Level labels: Support | Growth | Strength.
 */

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "../../utils/toast";

const LEVEL_COLORS = {
  Support:  "#f59e0b",
  Growth:   "#6366f1",
  Strength: "#10b981",
  Unknown:  "#94a3b8",
};

function Analytics() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/admin/analytics");
        setData(res.data.data);
      } catch (err) {
        toast.error(err.message || "Could not load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  if (!data) {
    return (
      <div className="p-4 md:p-10">
        <p className="text-stone-500">No data available.</p>
      </div>
    );
  }

  const {
    headline,
    signupsByDay,
    submissionsByDay,
    levelDistribution,
    categoryStats,
    recentSubmissions,
  } = data;

  return (
    <div className="p-4 md:p-10 space-y-5">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-1">
          Analytics
        </h1>
        <p className="text-sm text-stone-500">
          Overview of platform usage, signups, and assessment completion.
        </p>
      </div>

      {/* ── Headline stats — 2×2 on mobile, 4 across on md+ ────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Users"
          value={headline.totalUsers}
          subtitle={`${headline.verifiedRate}% verified`}
        />
        <StatCard
          label="New Today"
          value={headline.signupsToday}
          subtitle={`${headline.signupsThisWeek} this week`}
          accent="indigo"
        />
        <StatCard
          label="Completed"
          value={headline.submittedAssessments}
          subtitle={`${headline.completionRate}% completion`}
          accent="emerald"
        />
        <StatCard
          label="Avg Score"
          value={headline.avgScore ? `${headline.avgScore.toFixed(2)}` : "—"}
          subtitle="out of 5.00"
          accent="purple"
        />
      </div>

      {/* ── Charts row 1 — full width on mobile, side-by-side lg ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Signups (last 30 days)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={signupsByDay} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                tick={{ fontSize: 10, fill: "#78716c" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#78716c" }}
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e7e5e4",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Submissions (last 30 days)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={submissionsByDay} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                tick={{ fontSize: 10, fill: "#78716c" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#78716c" }}
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e7e5e4",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Charts row 2 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pie chart — fixed size, centred */}
        <ChartCard title="Level Distribution">
          {levelDistribution.length === 0 ? (
            <EmptyChart text="No completed assessments yet" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={levelDistribution}
                    dataKey="count"
                    nameKey="level"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={false}
                  >
                    {levelDistribution.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={LEVEL_COLORS[entry.level] || LEVEL_COLORS.Unknown}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e7e5e4",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend pills — cleaner than SVG labels on mobile */}
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {levelDistribution.map((entry) => (
                  <div key={entry.level} className="flex items-center gap-1.5 text-xs text-stone-600">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: LEVEL_COLORS[entry.level] || LEVEL_COLORS.Unknown }}
                    />
                    {entry.level} ({entry.count})
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        {/* Bar chart — horizontal scroll wrapper fixes mobile overflow */}
        <ChartCard title="Avg Score by Category">
          {categoryStats.length === 0 ? (
            <EmptyChart text="No data yet" />
          ) : (
            /* Outer div scrolls horizontally on very small screens */
            <div className="overflow-x-auto -mx-1">
              <div style={{ minWidth: Math.max(280, categoryStats.length * 28 + 160) }}>
                <ResponsiveContainer width="100%" height={Math.max(220, categoryStats.length * 28)}>
                  <BarChart
                    data={categoryStats}
                    layout="vertical"
                    margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[1, 5]}
                      tickCount={5}
                      tickFormatter={(v) => v.toFixed(1)}
                      tick={{ fontSize: 10, fill: "#78716c" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#78716c" }}
                      width={110}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${value.toFixed(2)} / 5`, "Avg Score"]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e7e5e4",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="avgScore" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Recent submissions ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-stone-200">
          <h3 className="font-semibold text-stone-900">Recent Submissions</h3>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="p-10 text-center text-stone-500 text-sm">
            No submissions yet.
          </div>
        ) : (
          <>
            {/* Desktop table — hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">User</th>
                    <th className="px-6 py-3 text-left font-medium">Score</th>
                    <th className="px-6 py-3 text-left font-medium">Level</th>
                    <th className="px-6 py-3 text-left font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentSubmissions.map((s) => (
                    <tr key={s._id} className="hover:bg-stone-50 transition">
                      <td className="px-6 py-3">
                        <div className="font-medium text-stone-900 text-sm">
                          {s.user?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-stone-400">{s.user?.email || "—"}</div>
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-stone-900">
                        {s.overallScore != null ? `${s.overallScore.toFixed(2)} / 5` : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <LevelBadge level={s.level} />
                      </td>
                      <td className="px-6 py-3 text-sm text-stone-400">
                        {new Date(s.submittedAt).toLocaleDateString("en-AU", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list — shown only on mobile */}
            <ul className="md:hidden divide-y divide-stone-100">
              {recentSubmissions.map((s) => (
                <li key={s._id} className="px-4 py-3 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {(s.user?.name || "?")
                      .split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {s.user?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-stone-400 truncate">{s.user?.email || "—"}</p>
                  </div>
                  {/* Score + level */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-stone-900">
                      {s.overallScore != null ? `${s.overallScore.toFixed(2)}` : "—"}
                      <span className="text-xs font-normal text-stone-400"> /5</span>
                    </p>
                    <LevelBadge level={s.level} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Level badge ──────────────────────────────────────────────────── */
function LevelBadge({ level }) {
  if (!level) return <span className="text-xs text-stone-400">—</span>;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${LEVEL_COLORS[level] || LEVEL_COLORS.Unknown}22`,
        color: LEVEL_COLORS[level] || LEVEL_COLORS.Unknown,
      }}
    >
      {level}
    </span>
  );
}

/* ── Stat card ────────────────────────────────────────────────────── */
function StatCard({ label, value, subtitle, accent }) {
  const borders = {
    indigo:  "border-l-indigo-500",
    emerald: "border-l-emerald-500",
    purple:  "border-l-purple-500",
    default: "border-l-stone-300",
  };
  return (
    <div className={`bg-white rounded-2xl border border-stone-200 border-l-4 ${borders[accent] || borders.default} p-4`}>
      <p className="text-xs uppercase tracking-wider text-stone-400 font-medium mb-1 truncate">
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-bold text-stone-900 mb-0.5">{value}</p>
      {subtitle && (
        <p className="text-xs text-stone-400 truncate">{subtitle}</p>
      )}
    </div>
  );
}

/* ── Chart card wrapper ───────────────────────────────────────────── */
function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <h3 className="font-semibold text-stone-900 text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}

/* ── Empty chart state ────────────────────────────────────────────── */
function EmptyChart({ text }) {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <p className="text-sm text-stone-400">{text}</p>
    </div>
  );
}

export default Analytics;