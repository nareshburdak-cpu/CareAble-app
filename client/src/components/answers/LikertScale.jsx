    /**
 * LikertScale — 1–5 agreement scale
 * ---------------------------------
 * Props:
 *   value     - current selected value (string "1"–"5")
 *   onChange  - called with the new value
 *   disabled  - prevent changes
 */

const LIKERT_OPTIONS = [
  { value: "1", short: "1", label: "Strongly Disagree" },
  { value: "2", short: "2", label: "Disagree" },
  { value: "3", short: "3", label: "Neutral" },
  { value: "4", short: "4", label: "Agree" },
  { value: "5", short: "5", label: "Strongly Agree" },
];

function LikertScale({ value, onChange, disabled = false }) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {LIKERT_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(value === opt.value ? "" : opt.value)}
              disabled={disabled}
              className={`px-2 py-3 rounded-lg border-2 text-sm font-medium transition ${
                selected
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                  : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-pressed={selected}
              aria-label={opt.label}
            >
              <div className="text-lg font-semibold">{opt.short}</div>
            </button>
          );
        })}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-1.5 px-1">
        <span>Strongly Disagree</span>
        <span className="hidden sm:inline">Neutral</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  );
}

export default LikertScale;