// client/src/components/ResultsSummary.jsx

function ResultsSummary({ categoryScores, categoryMeta }) {
  const scored = categoryMeta
    .map((cat) => ({ ...cat, score: categoryScores[cat.key] }))
    .filter((cat) => cat.score != null && cat.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        <EmptyCard icon="💪" title="Your Strength" color="green" text="No scores available yet." />
        <EmptyCard icon="🌱" title="Growth Area" color="amber" text="No scores available yet." />
      </div>
    );
  }

  const strongest = scored[0];
  const weakest = scored[scored.length - 1];
  const allSame = scored.every((c) => c.score === scored[0].score);

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">💪</span>
          <p className="text-sm font-semibold text-emerald-800">Your Strength</p>
        </div>
        {allSame ? (
          <p className="text-sm text-emerald-700 leading-relaxed">Balanced capability across all areas — keep it up!</p>
        ) : (
          <>
            <p className="text-sm font-medium text-emerald-900 mb-1">{strongest.icon} {strongest.label}</p>
            <p className="text-sm text-emerald-700 leading-relaxed">Scored <span className="font-bold">{strongest.score.toFixed(2)} / 5</span> — this is where your caregiving experience shines.</p>
          </>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🌱</span>
          <p className="text-sm font-semibold text-amber-800">Growth Area</p>
        </div>
        {allSame ? (
          <p className="text-sm text-amber-700 leading-relaxed">No particular growth area — great, consistent capability!</p>
        ) : (
          <>
            <p className="text-sm font-medium text-amber-900 mb-1">{weakest.icon} {weakest.label}</p>
            <p className="text-sm text-amber-700 leading-relaxed">Scored <span className="font-bold">{weakest.score.toFixed(2)} / 5</span> — additional resources could support growth here.</p>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCard({ icon, title, color, text }) {
  const colors = { green: "bg-emerald-50 border-emerald-100", amber: "bg-amber-50 border-amber-100" };
  return (
    <div className={"border rounded-xl p-4 " + colors[color]}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
      </div>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

export default ResultsSummary;