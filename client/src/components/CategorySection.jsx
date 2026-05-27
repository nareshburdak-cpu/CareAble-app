import { useState } from "react";
import { categoryColors, defaultCategoryColor } from "../utils/categoryColors";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";

function CategorySection({
  category,
  answers,
  defaultOpen = false,
  assessmentId,
  onAnswerSaved,
  onAnswerCleared,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const colors = categoryColors[category.color] || defaultCategoryColor;
  const answeredCount = category.questions.filter((q) =>
    Object.prototype.hasOwnProperty.call(answers, q._id.toString())
  ).length;
  const totalCount = category.questions.length;
  const isComplete = answeredCount === totalCount && totalCount > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-gray-50 transition"
        aria-expanded={open}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}>
            {category.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{category.label}</h3>
              {isComplete && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                  ✓ Complete
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">
              {category.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-2 flex-shrink-0">
          <span className={`text-sm font-medium ${isComplete ? "text-green-600" : "text-gray-600"}`}>
            {answeredCount}/{totalCount}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className="px-4 md:px-5 pb-3">
        <ProgressBar
          value={answeredCount}
          max={totalCount}
          showLabel={false}
          color={colors.progress}
        />
      </div>

      {open && (
        <div className="border-t border-gray-100 p-4 md:p-5 space-y-4 bg-gray-50">
          {category.questions.map((q, idx) => (
            <QuestionCard
              key={q._id}
              question={q}
              initialAnswer={answers[q._id]}
              index={idx}
              assessmentId={assessmentId}
              onSaved={onAnswerSaved}
              onCleared={onAnswerCleared}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CategorySection;
