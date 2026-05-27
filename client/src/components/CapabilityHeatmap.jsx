import { useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

const VIEWS = [
  { key: "radar", label: "Radar", icon: "🕸️" },
  { key: "bar",   label: "Bar",   icon: "📊" },
  { key: "heat",  label: "Heat",  icon: "🟥" },
];

function scoreColor(score) {
  if (score >= 4.5) return { bar: "#059669", label: "Strength" };
  if (score >= 4.0) return { bar: "#10b981", label: "Strength" };
  if (score >= 3.5) return { bar: "#6366f1", label: "Growth"   };
  if (score >= 3.0) return { bar: "#818cf8", label: "Growth"   };
  if (score >= 2.0) return { bar: "#f59e0b", label: "Developing" };
  return               { bar: "#f43f5e", label: "Support"  };
}

function heatBg(score) {
  if (score >= 4.5) return "rgb(6,95,70)";
  if (score >= 4.0) return "rgb(4,120,87)";
  if (score >= 3.5) return "rgb(55,48,163)";
  if (score >= 3.0) return "rgb(79,70,229)";
  if (score >= 2.5) return "rgb(217,119,6)";
  if (score >= 2.0) return "rgb(245,158,11)";
  if (score >= 1.5) return "rgb(244,63,94)";
  return "rgb(190,18,60)";
}

function CapabilityHeatmap({ categoryScores, categoryMeta }) {
  const [view, setView] = useState("radar");

  const data = categoryMeta
    .filter((cat) => categoryScores[cat.key] != null)
    .map((cat) => ({
      key: cat.key,
      category: cat.label,
      short: cat.label.length > 18 ? cat.label.slice(0, 16) + "…" : cat.label,
      icon: cat.icon,
      score: categoryScores[cat.key] || 0,
      fullMark: 5,
    }));

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {VIEWS.map((v) => (
          <button key={v.key} onClick={() => setView(v.key)}
            className={"flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 " + (view === v.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            <span>{v.icon}</span>
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {view === "radar" && <RadarView data={data} />}
      {view === "bar"   && <BarView   data={data} />}
      {view === "heat"  && <HeatView  data={data} />}

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100">
        {[
          { label: "Strength (4–5)",   color: "#10b981" },
          { label: "Growth (3–4)",     color: "#6366f1" },
          { label: "Developing (2–3)", color: "#f59e0b" },
          { label: "Support (1–2)",    color: "#f43f5e" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: l.color }} />
            <span className="text-xs text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarView({ data }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data} margin={{ top: 20, right: 50, bottom: 20, left: 50 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="category" tick={<CustomRadarTick />} />
        <PolarRadiusAxis angle={90} domain={[1, 5]} axisLine={false} tickCount={5} tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => v.toFixed(0)} />
        <Radar name="Capability" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
        <Tooltip content={<RadarTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function CustomRadarTick({ x, y, payload, textAnchor }) {
  const words = payload.value.split(" ");
  const lines = [];
  let cur = "";
  words.forEach((w) => {
    const next = (cur + " " + w).trim();
    if (next.length > 13 && cur) { lines.push(cur); cur = w; }
    else { cur = next; }
  });
  if (cur) lines.push(cur);
  return (
    <g transform={"translate(" + x + "," + y + ")"}>
      {lines.map((line, i) => <text key={i} x={0} y={i * 13} textAnchor={textAnchor} fill="#4b5563" fontSize={10} fontWeight={500}>{line}</text>)}
    </g>
  );
}

function RadarTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  const c = scoreColor(item.score);
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-xs">
      <p className="font-semibold text-gray-900 mb-0.5">{item.icon} {item.category}</p>
      <p style={{ color: c.bar }} className="font-medium">{c.label} — {item.score.toFixed(2)} / 5</p>
    </div>
  );
}

// Bar chart as inline rows — no recharts, no label cutoff
function BarView({ data }) {
  const sorted = [...data].sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-2">
      {sorted.map((item) => {
        const c = scoreColor(item.score);
        const pct = Math.min(100, Math.max(0, ((item.score - 1) / 4) * 100));
        return (
          <div key={item.key} className="flex items-center gap-2">
            <span className="text-sm flex-shrink-0 w-5 text-center">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-gray-700 truncate pr-2">{item.category}</p>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: c.bar }}>{item.score.toFixed(1)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", backgroundColor: c.bar }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Real heatmap — square tiles with color intensity
function HeatView({ data }) {
  const sorted = [...data].sort((a, b) => b.score - a.score);
  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
        {sorted.map((item) => {
          const bg = heatBg(item.score);
          return (
            <div key={item.key} title={item.category + ": " + item.score.toFixed(2) + " / 5"}
              className="relative aspect-square rounded-lg flex flex-col items-center justify-center p-1.5 cursor-default group transition-transform hover:scale-105"
              style={{ backgroundColor: bg }}>
              <span className="text-xl mb-0.5">{item.icon}</span>
              <p className="text-white text-xs font-semibold text-center leading-tight px-0.5 line-clamp-2">{item.short}</p>
              <p className="text-white text-sm font-bold mt-0.5">{item.score.toFixed(1)}</p>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap shadow-lg">{item.category}: {item.score.toFixed(2)} / 5</div>
                <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-400">Low</span>
        <div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(to right, rgb(190,18,60), rgb(245,158,11), rgb(79,70,229), rgb(4,120,87))" }} />
        <span className="text-xs text-gray-400">High</span>
      </div>
    </div>
  );
}

export default CapabilityHeatmap;
