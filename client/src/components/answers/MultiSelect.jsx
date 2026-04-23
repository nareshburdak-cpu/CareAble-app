/**
 * MultiSelect — Checkboxes styled as cards
 * ----------------------------------------
 * Props:
 *   values    - array of selected option values
 *   onChange  - called with new array
 *   options   - array of { value, label }
 *   disabled  - prevent changes
 */

function MultiSelect({ values = [], onChange, options, disabled = false }) {
  const toggle = (optValue) => {
    if (disabled) return;
    if (values.includes(optValue)) {
      onChange(values.filter((v) => v !== optValue));
    } else {
      onChange([...values, optValue]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const selected = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            disabled={disabled}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition ${
              selected
                ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-pressed={selected}
          >
            {/* Custom checkbox */}
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                selected
                  ? "bg-indigo-600 border-indigo-600"
                  : "bg-white border-gray-300"
              }`}
            >
              {selected && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            <span className="text-sm font-medium">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default MultiSelect;