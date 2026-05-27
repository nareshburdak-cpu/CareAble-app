function ResultsSummary({ categoryScores, categoryMeta }) {
  const scored = categoryMeta
    .map((cat) => ({ ...cat, score: categoryScores[cat.key] }))
    .filter((cat) => cat.score != null && cat.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <EmptyCard icon="S" title="Your Strength" color="green" text="No scores available yet." />
        <EmptyCard icon="G" title="Growth Area" color="amber" text="No scores available yet." />
      </div>
    );
  }

  const strongest = scored[0];
  const weakest = scored[scored.length - 1];
  const allSame = scored.every((c) => c.score === scored[0].score);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-base font-bold text-emerald-700">S</span>
          <p className="text-base font-semibold text-emerald-800">Your Strength</p>
        </div>
        {allSame ? (
          <p className="text-sm leading-relaxed text-emerald-700">
            Balanced capability across all areas. Keep it up.
          </p>
        ) : (
          <>
            <p className="mb-1 text-base font-medium text-emerald-900">
              {strongest.icon} {strongest.label}
            </p>
            <p className="text-sm leading-relaxed text-emerald-700">
              Scored <span className="font-bold">{strongest.score.toFixed(2)} / 5</span>. This is where your caregiving experience shines.
            </p>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-base font-bold text-amber-700">G</span>
          <p className="text-base font-semibold text-amber-800">Growth Area</p>
        </div>
        {allSame ? (
          <p className="text-sm leading-relaxed text-amber-700">
            No particular growth area. Great, consistent capability.
          </p>
        ) : (
          <>
            <p className="mb-1 text-base font-medium text-amber-900">
              {weakest.icon} {weakest.label}
            </p>
            <p className="text-sm leading-relaxed text-amber-700">
              Scored <span className="font-bold">{weakest.score.toFixed(2)} / 5</span>. Additional resources could support growth here.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCard({ icon, title, color, text }) {
  const colors = {
    green: "bg-emerald-50 border-emerald-100",
    amber: "bg-amber-50 border-amber-100",
  };

  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base font-bold text-gray-700">{icon}</span>
        <p className="text-base font-semibold text-gray-700">{title}</p>
      </div>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

export default ResultsSummary;
