// client/src/components/CapabilityHeatmap.jsx

/**
 * CapabilityHeatmap — Radar chart of per-domain capability scores
 * ---------------------------------------------------------------
 * Props:
 *   categoryScores  - { "communication-relational-care": 4.20, ... }
 *   categoryMeta    - array of { key, label, icon } from /api/questions
 *
 * Scores are on a 1–5 scale (Phase 12-A brief-aligned scoring).
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
  const data = categoryMeta
    .filter((cat) => categoryScores[cat.key] != null)
    .map((cat) => ({
      category: cat.label,
      icon: cat.icon,
      score: categoryScores[cat.key] || 0,
      fullMark: 5,
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
            domain={[1, 5]}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={false}
            tickCount={5}
            tickFormatter={(v) => v.toFixed(0)}
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

function CustomTick({ x, y, payload, textAnchor }) {
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
        {payload.value}
      </text>
    </g>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;
  return (
    <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-900">
        {item.icon} {item.category}
      </p>
      <p className="text-xs text-gray-500">
        Score: <span className="font-semibold text-indigo-600">{item.score.toFixed(2)} / 5</span>
      </p>
    </div>
  );
}

export default CapabilityHeatmap;