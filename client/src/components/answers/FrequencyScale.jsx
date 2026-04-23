/**
 * FrequencyScale — Never / Rarely / Sometimes / Often / Always
 * ------------------------------------------------------------
 * Uses the question's `options` array for labels (comes from backend).
 */

function FrequencyScale({ value, onChange, options, disabled = false }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? "" : opt.value)}
            disabled={disabled}
            className={`px-2 py-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition ${
              selected
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-pressed={selected}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default FrequencyScale;