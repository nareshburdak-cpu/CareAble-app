/**
 * CooldownBanner — Shown on Dashboard when user is in retake cooldown.
 * Displays a friendly "X days until you can retake" message.
 */

function CooldownBanner({ cooldown }) {
  if (!cooldown?.active) return null;

  const { daysRemaining, nextAvailableAt, cooldownDays } = cooldown;

  const nextDate = new Date(nextAvailableAt).toLocaleDateString("en-AU", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
            Retake available in {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
          </h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            You recently completed an assessment. To keep results meaningful, we ask you to wait <strong>{cooldownDays} days</strong> between attempts.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            Next retake: <strong>{nextDate}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CooldownBanner;