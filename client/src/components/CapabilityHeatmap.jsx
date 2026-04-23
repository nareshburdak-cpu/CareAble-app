/**
 * CapabilityHeatmap — Radar chart of category scores
 * --------------------------------------------------
 * Uses Recharts' RadarChart to visualise a user's strengths
 * across the 6 capability categories.
 *
 * Props:
 *   categoryScores  - { "personal-care": 72, "health-management": 85, ... }
 *   categoryMeta    - array of categories from /api/questions (for labels/icons)
 */

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function CapabilityHeatmap({ categoryScores, categoryMeta }) {
  // Shape the data Recharts wants
  const data = categoryMeta.map((cat) => ({
    category: cat.label,
    icon: cat.icon,
    score: categoryScores[cat.key] || 0,
    fullMark: 100,
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="category"
            tick={<CustomTick />}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickCount={6}
          />
          <Radar
            name="Capability"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---- Custom label ticks: show icon + category name ----
function CustomTick({ x, y, payload, textAnchor }) {
  const data = payload.value;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        textAnchor={textAnchor}
        fill="#374151"
        fontSize="12"
        fontWeight={500}
      >
        {data}
      </text>
    </g>
  );
}

// ---- Custom tooltip when hovering ----
function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;
  return (
    <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-900">
        {item.icon} {item.category}
      </p>
      <p className="text-xs text-gray-500">
        Score: <span className="font-semibold text-indigo-600">{item.score}/100</span>
      </p>
    </div>
  );
}

export default CapabilityHeatmap;