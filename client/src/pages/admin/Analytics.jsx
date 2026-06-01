import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import toast from "../../utils/toast";

const LEVEL_COLORS = {
  Support: "#f59e0b",
  Growth: "#6366f1",
  Strength: "#10b981",
  Unknown: "#94a3b8",
};

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentPage, setRecentPage] = useState(1);

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
      <div className="p-4 md:p-8">
        <p className="text-sm text-stone-500">No analytics data available.</p>
      </div>
    );
  }

  const {
    headline,
    signupsByDay = [],
    submissionsByDay = [],
    levelDistribution = [],
    categoryStats = [],
    recentSubmissions = [],
  } = data;

  const topLevel = levelDistribution.reduce((best, current) => {
    if (!best || current.count > best.count) return current;
    return best;
  }, null);

  const strongestCategory = [...categoryStats].sort((a, b) => b.avgScore - a.avgScore)[0];
  const recentPageSize = 15;
  const recentTotalPages = Math.max(1, Math.ceil(recentSubmissions.length / recentPageSize));
  const safeRecentPage = Math.min(recentPage, recentTotalPages);
  const pagedRecentSubmissions = recentSubmissions.slice(
    (safeRecentPage - 1) * recentPageSize,
    safeRecentPage * recentPageSize
  );
  const recentRangeStart = recentSubmissions.length === 0 ? 0 : (safeRecentPage - 1) * recentPageSize + 1;
  const recentRangeEnd = Math.min(safeRecentPage * recentPageSize, recentSubmissions.length);

  const headlineStats = [
    {
      label: "Total users",
      value: headline.totalUsers,
      note: `${headline.verifiedRate}% verified`,
      tone: "stone",
    },
    {
      label: "New today",
      value: headline.signupsToday,
      note: `${headline.signupsThisWeek} this week`,
      tone: "indigo",
    },
    {
      label: "Completed",
      value: headline.submittedAssessments,
      note: `${headline.completionRate}% completion`,
      tone: "emerald",
    },
    {
      label: "Average score",
      value: headline.avgScore ? headline.avgScore.toFixed(2) : "-",
      note: "out of 5.00",
      tone: "violet",
    },
  ];

  const compactInsights = [
    {
      label: "Completion rate",
      value: `${headline.completionRate}%`,
      tone: "indigo",
    },
    {
      label: "Most common level",
      value: topLevel?.level || "Unknown",
      tone: "emerald",
    },
    {
      label: "Strongest domain",
      value: strongestCategory?.label || "No data",
      tone: "amber",
    },
  ];

  const summaryCards = [
    {
      eyebrow: "Accounts",
      label: "Verified accounts",
      value: `${headline.verifiedRate}%`,
      helper: "Confirmed email access",
      accent: "indigo",
    },
    {
      eyebrow: "Growth",
      label: "Weekly signups",
      value: headline.signupsThisWeek,
      helper: "Created in the last 7 days",
      accent: "amber",
    },
    {
      eyebrow: "Assessments",
      label: "Submitted results",
      value: headline.submittedAssessments,
      helper: "Completed assessments in system",
      accent: "emerald",
    },
    {
      eyebrow: "Quality",
      label: "Average score",
      value: headline.avgScore ? `${headline.avgScore.toFixed(2)} / 5` : "-",
      helper: "Across all submitted assessments",
      accent: "violet",
    },
  ];

  const mixCards = [
    {
      label: "Verified users",
      value: `${headline.verifiedRate}%`,
      tone: "indigo",
    },
    {
      label: "Avg score",
      value: headline.avgScore ? headline.avgScore.toFixed(2) : "-",
      tone: "violet",
    },
    {
      label: "New this week",
      value: headline.signupsThisWeek,
      tone: "emerald",
    },
  ];

  return (
    <div className="mx-auto max-w-[1360px] space-y-4 p-4 md:p-6 xl:p-8">
      <section className="rounded-[1.4rem] border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
                Admin analytics
              </p>
              <h1 className="mt-2 font-serif text-2xl font-bold leading-tight text-stone-900 md:text-3xl">
                Platform overview
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">
                Track growth, assessment completion, score quality, and the capability areas shaping
                recent outcomes.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[440px] xl:max-w-[520px] xl:flex-1">
              {compactInsights.map((item) => (
                <InsightChip key={item.label} {...item} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4 md:px-6">
          {headlineStats.map((item) => (
            <HeadlineStat key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard eyebrow="Acquisition" title="Signups over the last 30 days" note="Daily account creation trend">
          <ResponsiveContainer width="100%" height={248}>
            <LineChart data={signupsByDay} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#ece8e3" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value.slice(5)}
                tick={{ fontSize: 12, fill: "#78716c" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#78716c" }}
                tickLine={false}
                axisLine={false}
                width={28}
                allowDecimals={false}
              />
              <Tooltip content={<LineTooltip label="Signups" />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#6366f1" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard eyebrow="Completion" title="Submissions over the last 30 days" note="Daily completed assessment volume">
          <ResponsiveContainer width="100%" height={248}>
            <LineChart data={submissionsByDay} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#ece8e3" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value.slice(5)}
                tick={{ fontSize: 12, fill: "#78716c" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#78716c" }}
                tickLine={false}
                axisLine={false}
                width={28}
                allowDecimals={false}
              />
              <Tooltip content={<LineTooltip label="Submissions" />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#8b5cf6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.85fr)]">
        <ChartCard
          eyebrow="Capability"
          title="Average score by category"
          note="Performance across submitted assessments"
        >
          {categoryStats.length === 0 ? (
            <EmptyState text="No category score data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, categoryStats.length * 28)}>
              <BarChart
                data={categoryStats}
                layout="vertical"
                margin={{ top: 4, right: 10, left: 8, bottom: 4 }}
              >
                <CartesianGrid stroke="#ece8e3" strokeDasharray="4 4" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[1, 5]}
                  tickCount={5}
                  tickFormatter={(value) => value.toFixed(1)}
                  tick={{ fontSize: 12, fill: "#78716c" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={122}
                  tick={{ fontSize: 12, fill: "#57534e" }}
                  tickFormatter={(value) => truncateLabel(value, 16)}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="avgScore" fill="#6366f1" radius={[0, 8, 8, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="grid gap-3">
          <ChartCard eyebrow="Levels" title="Capability level mix" note="Distribution of submitted outcomes">
            {levelDistribution.length === 0 ? (
              <EmptyState text="No completed assessments yet" />
            ) : (
              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-1">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={levelDistribution}
                      dataKey="count"
                      nameKey="level"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={2}
                    >
                      {levelDistribution.map((entry) => (
                        <Cell
                          key={entry.level}
                          fill={LEVEL_COLORS[entry.level] || LEVEL_COLORS.Unknown}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="grid gap-2">
                  {levelDistribution.map((entry) => (
                    <div
                      key={entry.level}
                      className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: LEVEL_COLORS[entry.level] || LEVEL_COLORS.Unknown }}
                        />
                        <span className="truncate text-sm text-stone-700">{entry.level}</span>
                      </div>
                      <span className="ml-3 flex-shrink-0 text-sm font-semibold text-stone-900">
                        {entry.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>

          <ChartCard eyebrow="Snapshot" title="Key signals" note="Current highlights from the dataset">
            <div className="grid gap-2">
              <SignalRow
                label="Top capability level"
                value={topLevel?.level || "Unknown"}
                helper={topLevel ? `${topLevel.count} recent outcomes` : "No data yet"}
              />
              <SignalRow
                label="Best-performing category"
                value={strongestCategory?.label || "No data"}
                helper={
                  strongestCategory
                    ? `${strongestCategory.avgScore.toFixed(2)} / 5 average`
                    : "No category scores yet"
                }
              />
              <SignalRow
                label="Assessment throughput"
                value={`${headline.submittedAssessments}`}
                helper={`${headline.completionRate}% completion rate`}
              />
            </div>
          </ChartCard>

          <ChartCard eyebrow="Health" title="Submission mix" note="Compact operational metrics">
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
              {mixCards.map((item) => (
                <MixCard key={item.label} {...item} />
              ))}
            </div>
          </ChartCard>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.4rem] border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Activity</p>
            <h2 className="mt-1 text-base font-semibold text-stone-900">Recent submissions</h2>
          </div>
          <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            {recentRangeStart}-{recentRangeEnd} of {recentSubmissions.length}
          </div>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">No submissions yet.</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-stone-50 text-xs uppercase tracking-[0.18em] text-stone-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">User</th>
                    <th className="px-6 py-3 text-left font-medium">Score</th>
                    <th className="px-6 py-3 text-left font-medium">Level</th>
                    <th className="px-6 py-3 text-left font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pagedRecentSubmissions.map((submission) => (
                    <tr key={submission._id} className="transition hover:bg-stone-50">
                      <td className="px-6 py-3.5">
                        <div className="text-sm font-semibold text-stone-900">
                          {submission.user?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-stone-400">{submission.user?.email || "-"}</div>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-stone-900">
                        {submission.overallScore != null ? `${submission.overallScore.toFixed(2)} / 5` : "-"}
                      </td>
                      <td className="px-6 py-3.5">
                        <LevelBadge level={submission.level} />
                      </td>
                      <td className="px-6 py-3.5 text-sm text-stone-400">
                        {new Date(submission.submittedAt).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-stone-100 md:hidden">
              {pagedRecentSubmissions.map((submission) => (
                <li key={submission._id} className="flex items-center gap-3 px-4 py-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
                    {(submission.user?.name || "?")
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {submission.user?.name || "Unknown"}
                    </p>
                    <p className="truncate text-sm text-stone-400">{submission.user?.email || "-"}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      {new Date(submission.submittedAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-stone-900">
                      {submission.overallScore != null ? submission.overallScore.toFixed(2) : "-"}
                      <span className="text-xs font-normal text-stone-400"> /5</span>
                    </p>
                    <div className="mt-1">
                      <LevelBadge level={submission.level} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {recentTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-stone-200 px-5 py-3.5 md:px-6">
                <p className="text-xs text-stone-500">
                  Page <span className="font-medium text-stone-700">{safeRecentPage}</span> of{" "}
                  <span className="font-medium text-stone-700">{recentTotalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRecentPage((current) => Math.max(1, current - 1))}
                    disabled={safeRecentPage === 1}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setRecentPage((current) => Math.min(recentTotalPages, current + 1))}
                    disabled={safeRecentPage === recentTotalPages}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function InsightChip({ label, value, tone }) {
  const tones = {
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div className={`min-w-0 rounded-xl border px-3 py-2.5 ${tones[tone] || tones.indigo}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-5">{value}</p>
    </div>
  );
}

function HeadlineStat({ label, value, note, tone }) {
  const tones = {
    stone: "border-stone-200 bg-stone-50",
    indigo: "border-indigo-200 bg-indigo-50/70",
    emerald: "border-emerald-200 bg-emerald-50/70",
    violet: "border-violet-200 bg-violet-50/70",
  };

  return (
    <div className={`rounded-[1rem] border p-3.5 ${tones[tone] || tones.stone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-bold leading-none text-stone-900">{value}</p>
        <p className="text-right text-xs leading-4 text-stone-500">{note}</p>
      </div>
    </div>
  );
}

function SummaryCard({ eyebrow, label, value, helper, accent }) {
  const accents = {
    indigo: "border-indigo-200",
    amber: "border-amber-200",
    emerald: "border-emerald-200",
    violet: "border-violet-200",
  };

  return (
    <div className={`rounded-[1.15rem] border bg-white p-4 shadow-sm ${accents[accent] || "border-stone-200"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{eyebrow}</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-600">{label}</p>
          <p className="mt-2 text-2xl font-bold leading-none text-stone-900">{value}</p>
        </div>
        <div className="h-9 w-1.5 flex-shrink-0 rounded-full bg-stone-100">
          <div className={`h-full w-full rounded-full ${getAccentBar(accent)}`} />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-500">{helper}</p>
    </div>
  );
}

function ChartCard({ eyebrow, title, note, children }) {
  return (
    <div className="rounded-[1.2rem] border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{eyebrow}</p>
        <h3 className="mt-1 text-base font-semibold text-stone-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-stone-500">{note}</p>
      </div>
      {children}
    </div>
  );
}

function SignalRow({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-1 break-words text-base font-semibold text-stone-900">{value}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function MixCard({ label, value, tone }) {
  const tones = {
    indigo: "border-indigo-200 bg-indigo-50/70",
    violet: "border-violet-200 bg-violet-50/70",
    emerald: "border-emerald-200 bg-emerald-50/70",
  };

  return (
    <div className={`rounded-xl border px-3 py-3 ${tones[tone] || "border-stone-200 bg-stone-50"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-stone-500">{label}</p>
        <p className="text-lg font-bold text-stone-900">{value}</p>
      </div>
    </div>
  );
}

function LevelBadge({ level }) {
  if (!level) return <span className="text-xs text-stone-400">-</span>;

  return (
    <span
      className="inline-block rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${LEVEL_COLORS[level] || LEVEL_COLORS.Unknown}22`,
        color: LEVEL_COLORS[level] || LEVEL_COLORS.Unknown,
      }}
    >
      {level}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl bg-stone-50">
      <p className="text-sm text-stone-400">{text}</p>
    </div>
  );
}

function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <p className="mt-1 text-sm text-stone-500">{payload[0].payload.date}</p>
      <p className="mt-1 text-lg font-semibold text-stone-900">{payload[0].value}</p>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-stone-900">{item.name}</p>
      <p className="mt-1 text-sm text-stone-500">{item.value} outcomes</p>
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-stone-900">{label}</p>
      <p className="mt-1 text-sm text-stone-500">{payload[0].value.toFixed(2)} / 5</p>
    </div>
  );
}

function truncateLabel(value, maxLength) {
  if (!value || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}

function getAccentBar(accent) {
  const accents = {
    indigo: "bg-indigo-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
  };

  return accents[accent] || "bg-stone-400";
}

export default Analytics;
