// client/src/components/CooldownBanner.jsx

/**
 * CooldownBanner — Shown on Dashboard when user is in retake cooldown.
 * Handles both sub-24h (hours) and multi-day display.
 */
function CooldownBanner({ cooldown }) {
  if (!cooldown?.active) return null;

  const { hoursRemaining, daysRemaining, nextAvailableAt, cooldownHours } = cooldown;

  // Prefer hours display when under 24h remaining, days otherwise
  const showHours = hoursRemaining != null && hoursRemaining <= 24;

  const waitLabel = showHours
    ? `${hoursRemaining} hour${hoursRemaining === 1 ? "" : "s"}`
    : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;

  const cooldownLabel = cooldownHours != null && cooldownHours < 24
    ? `${cooldownHours} hour${cooldownHours === 1 ? "" : "s"}`
    : daysRemaining != null
      ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`
      : `${Math.round((cooldownHours ?? 24) / 24)} day${Math.round((cooldownHours ?? 24) / 24) === 1 ? "" : "s"}`;

  const nextDate = nextAvailableAt
    ? new Date(nextAvailableAt).toLocaleString("en-AU", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: showHours ? "numeric" : undefined,
        minute: showHours ? "2-digit" : undefined,
      })
    : null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 md:p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-blue-900 mb-1">
            Retake available in {waitLabel}
          </h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            You recently completed an assessment. To keep results meaningful, we ask you to wait{" "}
            <strong>{cooldownLabel}</strong> between attempts.
          </p>
          {nextDate && (
            <p className="text-sm text-blue-700 mt-2">
              Next retake: <strong>{nextDate}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CooldownBanner;
