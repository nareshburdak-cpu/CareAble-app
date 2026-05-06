// client/src/components/CategoryScoreCard.jsx

/**
 * CategoryScoreCard — Score card for one capability domain
 * --------------------------------------------------------
 * Shows the domain score, a progress bar, and the tier level.
 * Scores are on a 1–5 scale (Phase 12-A).
 *
 * Tiers (brief-aligned):
 *   Strength  >= 4.0
 *   Growth    >= 3.0
 *   Support   <  3.0
 */

import { categoryColors, defaultCategoryColor } from "../utils/categoryColors";

function CategoryScoreCard({ category, score }) {
  const colors = categoryColors[category.color] || defaultCategoryColor;

  // Brief-aligned 3-tier levels
  const tier =
    score >= 4.0 ? "Strength"
    : score >= 3.0 ? "Growth"
    : "Support";

  // Progress bar: map 1–5 to 0–100% width.
  // Score of 1 = 0%, score of 5 = 100%.
  // Clamped to [0, 100] for safety.
  const barWidth = Math.min(100, Math.max(0, ((score - 1) / 4) * 100));

  // Null/missing score (category had no scoreable questions)
  const hasScore = score != null && score > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center text-xl flex-shrink-0`}>
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-semibold text-gray-900 truncate">{category.label}</h3>
            {hasScore && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                {tier}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{category.description}</p>
        </div>
      </div>

      {hasScore ? (
        <>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-bold text-gray-900">{score.toFixed(2)}</span>
            <span className="text-sm text-gray-400">/ 5</span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${colors.progress} transition-all duration-700`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 italic">No scored questions in this domain</p>
      )}
    </div>
  );
}

export default CategoryScoreCard;