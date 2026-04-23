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
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
          <span>
            {value} / {max} answered
          </span>
          <span className="font-medium">{percent}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;