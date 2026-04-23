/**
 * ResultsSummary — Highlights the user's strongest + weakest categories
 * ---------------------------------------------------------------------
 * Gives personalised, actionable insights based on scores.
 */

function ResultsSummary({ categoryScores, categoryMeta }) {
  // Find top + bottom categories
  const sorted = categoryMeta
    .map((cat) => ({
      ...cat,
      score: categoryScores[cat.key] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // If all scores are identical, don't show strength/weakness
  const allSame = sorted.every((c) => c.score === sorted[0].score);

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
              You scored <strong>{strongest.score}/100</strong> — this is where
              your caregiving experience shines.
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
              With a score of <strong>{weakest.score}/100</strong>, this is an
              area where additional resources could support you.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ResultsSummary;