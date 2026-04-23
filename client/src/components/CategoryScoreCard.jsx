/**
 * CategoryScoreCard — Score card for one category
 * -----------------------------------------------
 * Shows the score, a visual progress bar, and the category description.
 */

import { categoryColors, defaultCategoryColor } from "../utils/categoryColors";

function CategoryScoreCard({ category, score }) {
  const colors = categoryColors[category.color] || defaultCategoryColor;

  const tier =
    score >= 80 ? "Strong"
      : score >= 60 ? "Confident"
      : score >= 40 ? "Growing"
      : "Emerging";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center text-xl flex-shrink-0`}>
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-semibold text-gray-900 truncate">{category.label}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
              {tier}
            </span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{category.description}</p>
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-gray-900">{score}</span>
        <span className="text-sm text-gray-400">/100</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${colors.progress} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default CategoryScoreCard;