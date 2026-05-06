// client/src/pages/admin/Analytics.jsx

/**
 * Admin Analytics Dashboard
 * --------------------------
 * Shows headline stats, charts, and recent activity.
 * All data fetched from /api/admin/analytics.
 *
 * Phase 12-A: scores are now 1–5 floats (not 0–100).
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

// Brief-aligned level colours
const LEVEL_COLORS = {
  Support:  "#f59e0b",  // amber
  Growth:   "#6366f1",  // indigo
  Strength: "#10b981",  // emerald
  Unknown:  "#94a3b8",  // slate
};

function Analytics() {
  const [data, setData] = useState(null);
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
      <div className="p-6 md:p-10">
        <p className="text-stone-500">No data available.</p>
      </div>
    );
  }

  const { headline, signupsByDay, submissionsByDay, levelDistribution, categoryStats, recentSubmissions } = data;

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
          Analytics
        </h1>
        <p className="text-stone-600">
          Overview of platform usage, signups, and assessment completion.
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          subtitle={`${headline.completionRate}% completion rate`}
          accent="emerald"
        />
        <StatCard
          label="Avg Score"
          value={headline.avgScore ? `${headline.avgScore.toFixed(2)}` : "—"}
          subtitle="out of 5.00"
          accent="purple"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Signups (last 30 days)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={signupsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                tick={{ fontSize: 11, fill: "#78716c" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#78716c" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e7e5e4",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Submissions (last 30 days)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={submissionsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                tick={{ fontSize: 11, fill: "#78716c" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#78716c" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e7e5e4",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Level Distribution">
          {levelDistribution.length === 0 ? (
            <EmptyChart text="No completed assessments yet" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={levelDistribution}
                  dataKey="count"
                  nameKey="level"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.level} (${entry.count})`}
                >
                  {levelDistribution.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={LEVEL_COLORS[entry.level] || LEVEL_COLORS.Unknown}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Avg Score by Category">
          {categoryStats.length === 0 ? (
            <EmptyChart text="No data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryStats} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  type="number"
                  domain={[1, 5]}
                  tickCount={5}
                  tickFormatter={(v) => v.toFixed(1)}
                  tick={{ fontSize: 11, fill: "#78716c" }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#78716c" }}
                  width={120}
                />
                <Tooltip
                  formatter={(value) => [`${value.toFixed(2)} / 5`, "Avg Score"]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e7e5e4",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="avgScore" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h3 className="font-semibold text-stone-900">Recent Submissions</h3>
        </div>
        {recentSubmissions.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            No submissions yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-600">
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
                  <td className="px-6 py-4">
                    <div className="font-medium text-stone-900 text-sm">
                      {s.user?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-stone-500">{s.user?.email || "—"}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-stone-900">
                    {s.overallScore != null ? `${s.overallScore.toFixed(2)} / 5` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${LEVEL_COLORS[s.level] || LEVEL_COLORS.Unknown}20`,
                        color: LEVEL_COLORS[s.level] || LEVEL_COLORS.Unknown,
                      }}
                    >
                      {s.level || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {new Date(s.submittedAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---- Stat card ----
function StatCard({ label, value, subtitle, accent }) {
  const accents = {
    indigo: "border-l-indigo-500",
    emerald: "border-l-emerald-500",
    purple: "border-l-purple-500",
    default: "border-l-stone-300",
  };

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 border-l-4 ${accents[accent] || accents.default} p-5`}>
      <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold text-stone-900 mb-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-stone-500">{subtitle}</p>
      )}
    </div>
  );
}

// ---- Chart card wrapper ----
function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <h3 className="font-semibold text-stone-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ---- Empty state for charts ----
function EmptyChart({ text }) {
  return (
    <div className="h-[250px] flex items-center justify-center">
      <p className="text-sm text-stone-400">{text}</p>
    </div>
  );
}

export default Analytics;