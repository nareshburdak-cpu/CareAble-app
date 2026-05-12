// client/src/utils/toast.jsx

/* eslint-disable react-refresh/only-export-components */
/**
 * Custom toast utility — Modern Edition
 * --------------------------------------
 * Design highlights:
 *   - Frosted glass background (backdrop blur)
 *   - Animated progress ring around icon (countdown to auto-dismiss)
 *   - Gradient icon badge with subtle glow
 *   - Smooth slide+fade enter/exit
 *   - Hover-to-pause progress
 *   - Max 3 toasts; instant dismiss on X
 */

import hotToast from "react-hot-toast";

// ── Toast queue management ──────────────────────────────────────
const MAX_TOASTS = 3;
const activeToastIds = [];

function trackToast(id) {
  activeToastIds.push(id);
  while (activeToastIds.length > MAX_TOASTS) {
    const oldest = activeToastIds.shift();
    hotToast.remove(oldest);
  }
}

function untrackToast(id) {
  const idx = activeToastIds.indexOf(id);
  if (idx !== -1) activeToastIds.splice(idx, 1);
}

// ── Variant configs ─────────────────────────────────────────────
const VARIANTS = {
  success: {
    gradient: "from-emerald-400 to-teal-500",
    glow:     "shadow-emerald-500/40",
    ring:     "stroke-emerald-500",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor"
        viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    gradient: "from-rose-400 to-red-500",
    glow:     "shadow-red-500/40",
    ring:     "stroke-red-500",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor"
        viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    gradient: "from-sky-400 to-indigo-500",
    glow:     "shadow-indigo-500/40",
    ring:     "stroke-indigo-500",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor"
        viewBox="0 0 24 24" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

// ── Toast body ──────────────────────────────────────────────────
function ToastBody({ id, variant, message, visible, duration }) {
  const v = VARIANTS[variant];

  const dismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    untrackToast(id);
    hotToast.remove(id);
  };

  // Progress ring math
  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`
        toast-card
        relative flex items-center gap-3
        min-w-[280px] max-w-[400px] w-full
        px-3 py-3 pr-2.5
        bg-white/80 backdrop-blur-xl
        border border-white/40
        rounded-2xl
        shadow-[0_10px_40px_-8px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)]
        transition-all duration-300 ease-out
        ${visible
          ? "opacity-100 translate-x-0 scale-100"
          : "opacity-0 translate-x-4 scale-95"}
      `}
      style={{ pointerEvents: "auto" }}
    >
      {/* Icon with progress ring */}
      <div className="relative flex-shrink-0">
        {/* Animated countdown ring */}
        <svg className="absolute inset-0 -rotate-90" width={44} height={44}>
          <circle
            cx={22}
            cy={22}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-gray-200"
          />
          <circle
            cx={22}
            cy={22}
            r={radius}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            className={v.ring}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: 0,
              animation: visible
                ? `toast-countdown ${duration}ms linear forwards`
                : "none",
            }}
          />
        </svg>

        {/* Gradient icon badge */}
        <div className={`
          relative w-11 h-11 rounded-full
          bg-gradient-to-br ${v.gradient}
          shadow-lg ${v.glow}
          flex items-center justify-center
          text-white
        `}>
          {v.icon}
        </div>
      </div>

      {/* Message */}
      <p className="flex-1 text-[14px] font-medium text-gray-800 leading-snug py-0.5">
        {message}
      </p>

      {/* Dismiss button */}
      <button
        type="button"
        onMouseDown={dismiss}
        onTouchStart={dismiss}
        aria-label="Dismiss notification"
        className="
          flex-shrink-0 w-7 h-7 rounded-lg
          flex items-center justify-center
          text-gray-400 hover:text-gray-700
          hover:bg-gray-900/5
          transition-all duration-150
          cursor-pointer
          group
        "
      >
        <svg
          className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200"
          fill="none" stroke="currentColor"
          viewBox="0 0 24 24" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Inject keyframes once ───────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("toast-keyframes")) {
  const style = document.createElement("style");
  style.id = "toast-keyframes";
  style.textContent = `
    @keyframes toast-countdown {
      from { stroke-dashoffset: 0; }
      to   { stroke-dashoffset: ${2 * Math.PI * 18}; }
    }
  `;
  document.head.appendChild(style);
}

// ── Public API ──────────────────────────────────────────────────
function show(variant, message, options = {}) {
  const duration = options.duration ?? 400000;

  const id = hotToast.custom(
    (t) => (
      <ToastBody
        id={t.id}
        variant={variant}
        message={message}
        visible={t.visible}
        duration={duration}
      />
    ),
    {
      duration,
      style: { background: "transparent", boxShadow: "none", padding: 0 },
      ...options,
    }
  );
  trackToast(id);
  return id;
}

const toast = {
  success: (msg, opts) => show("success", msg, opts),
  error:   (msg, opts) => show("error",   msg, opts),
  info:    (msg, opts) => show("info",    msg, opts),

  loading: hotToast.loading,
  promise: hotToast.promise,
  dismiss: hotToast.dismiss,
  remove:  hotToast.remove,
  custom:  hotToast.custom,
};

export default toast;