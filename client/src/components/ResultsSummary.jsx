// client/src/components/ResultsSummary.jsx

/**
 * ResultsSummary — Highlights strongest + weakest domains
 * -------------------------------------------------------
 * Scores are on a 1–5 scale. Tier labels are brief-aligned:
 *   Strength / Growth / Support
 */

function ResultsSummary({ categoryScores, categoryMeta }) {
  // Only include domains that have a real score
  const scored = categoryMeta
    .map((cat) => ({ ...cat, score: categoryScores[cat.key] }))
    .filter((cat) => cat.score != null && cat.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <EmptyCard icon="💪" title="Your Strength" color="green" text="No scores available yet." />
        <EmptyCard icon="🌱" title="Growth Area" color="amber" text="No scores available yet." />
      </div>
    );
  }

  const strongest = scored[0];
  const weakest = scored[scored.length - 1];
  const allSame = scored.every((c) => c.score === scored[0].score);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Strength */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💪</span>
          <h3 className="font-semibold text-green-900">Your Strength</h3>
        </div>
        {allSame ? (
          <p className="text-sm text-green-800">
            You show balanced capability across all areas — keep it up!
          </p>
        ) : (
          <>
            <p className="text-green-900 font-medium mb-1">
              {strongest.icon} {strongest.label}
            </p>
            <p className="text-sm text-green-800">
              You scored <strong>{strongest.score.toFixed(2)} / 5</strong> — this is
              where your caregiving experience shines.
            </p>
          </>
        )}
      </div>

      {/* Growth area */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🌱</span>
          <h3 className="font-semibold text-amber-900">Growth Area</h3>
        </div>
        {allSame ? (
          <p className="text-sm text-amber-800">
            No particular growth area — great, consistent capability!
          </p>
        ) : (
          <>
            <p className="text-amber-900 font-medium mb-1">
              {weakest.icon} {weakest.label}
            </p>
            <p className="text-sm text-amber-800">
              With a score of <strong>{weakest.score.toFixed(2)} / 5</strong>, this is
              an area where additional resources could support you.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCard({ icon, title, color, text }) {
  const colors = {
    green: "from-green-50 to-emerald-50 border-green-100",
    amber: "from-amber-50 to-orange-50 border-amber-100",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-6`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

export default ResultsSummary;