/**
 * ProgressBar — Animated progress bar
 * -----------------------------------
 * Props:
 *   value       - current value
 *   max         - maximum value
 *   showLabel   - whether to show "X / Y" text
 *   color       - Tailwind color class (e.g. "bg-indigo-500")
 */

function ProgressBar({ value, max, showLabel = true, color = "bg-indigo-500" }) {
  const safeMax = Math.max(0, max || 0);
  const safeValue = Math.max(0, Math.min(value || 0, safeMax));
  const percent = safeMax > 0 ? Math.min(100, Math.round((safeValue / safeMax) * 100)) : 0;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
          <span>
            {safeValue} / {safeMax} answered
          </span>
          <span className="font-medium">{percent}%</span>
        </div>
      )}
      <div
        className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={`${safeValue} of ${safeMax} answered`}
      >
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
