/* eslint-disable react-refresh/only-export-components */
/**
 * Custom toast utility
 * --------------------
 * Wraps react-hot-toast to add:
 *   - ✅ Always-visible close (×) button
 *   - ✅ Custom icon + clean styling
 *   - ✅ Smooth slide-in animation
 *   - ✅ Click-to-dismiss
 *
 * Usage:
 *   import toast from "../utils/toast";
 *   toast.success("Saved!");
 *   toast.error("Something went wrong");
 *   toast.info("FYI");
 */

import hotToast from "react-hot-toast";

// Toast variant configs
const VARIANTS = {
  success: {
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    accentBar: "bg-emerald-500",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
    accentBar: "bg-red-500",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
      >
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
  info: {
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    accentBar: "bg-blue-500",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
      >
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
};

// Toast body (memoized via render fn — react-hot-toast manages it)
function ToastBody({ id, variant, message }) {
  const config = VARIANTS[variant];

  // Use mousedown — fires faster than click
  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    hotToast.dismiss(id);
  };

  return (
    <div className="flex items-stretch min-w-[280px] max-w-md w-full bg-white rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden pointer-events-auto">
      {/* Left accent bar */}
      <div className={`w-1 ${config.accentBar} flex-shrink-0`} />

      {/* Icon */}
      <div className={`flex items-start pl-3 pt-3.5 ${config.iconColor}`}>
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center ${config.iconBg}`}
        >
          {config.icon}
        </span>
      </div>

      {/* Message */}
      <p className="flex-1 text-sm text-gray-800 leading-relaxed py-3.5 px-3">
        {message}
      </p>

      {/* Close button */}
      <button
        type="button"
        onMouseDown={handleClose}
        aria-label="Close notification"
        className="flex-shrink-0 flex items-start pr-2 pt-2.5 group"
      >
        <span className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100 transition">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}

// Public API
const toast = {
  success: (message, options = {}) =>
    hotToast.custom(
      (t) => <ToastBody id={t.id} variant="success" message={message} />,
      { duration: 4000, ...options }
    ),

  error: (message, options = {}) =>
    hotToast.custom(
      (t) => <ToastBody id={t.id} variant="error" message={message} />,
      { duration: 4000, ...options }
    ),

  info: (message, options = {}) =>
    hotToast.custom(
      (t) => <ToastBody id={t.id} variant="info" message={message} />,
      { duration: 4000, ...options }
    ),

  // Pass-through for advanced usage
  loading: hotToast.loading,
  promise: hotToast.promise,
  dismiss: hotToast.dismiss,
  custom: hotToast.custom,
};

export default toast;