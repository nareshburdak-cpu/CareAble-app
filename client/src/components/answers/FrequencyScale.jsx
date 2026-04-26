/**
 * FrequencyScale — Never / Rarely / Sometimes / Often / Always
 * ------------------------------------------------------------
 * Mobile-friendly: shows short codes on small screens, full labels on larger.
 * Tooltip on hover/focus shows the full label too.
 */

// Map full labels to short codes for mobile
const SHORT_LABELS = {
  never: "Nv",
  rarely: "Ra",
  sometimes: "Sm",
  often: "Of",
  always: "Aw",
};

function FrequencyScale({ value, onChange, options, disabled = false }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full">
      {options.map((opt) => {
        const selected = value === opt.value;
        const shortLabel = SHORT_LABELS[opt.value?.toLowerCase()] || opt.label?.slice(0, 2);

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? "" : opt.value)}
            disabled={disabled}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={selected}
            className={`min-w-0 px-1 sm:px-2 py-3 rounded-lg border-2 font-medium transition flex flex-col items-center justify-center gap-0.5 ${
              selected
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {/* Short label — shown on mobile only */}
            <span className="sm:hidden text-base font-bold">
              {shortLabel}
            </span>
            {/* Full label — shown on tablet+ */}
            <span className="hidden sm:inline text-sm">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default FrequencyScale;