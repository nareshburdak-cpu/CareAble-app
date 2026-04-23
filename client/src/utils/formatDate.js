/**
 * formatDate — Human-friendly date formatting
 * -------------------------------------------
 *   relativeTime  : "2 min ago", "3 hours ago", "Yesterday", "Apr 20"
 *   fullDate      : "23 Apr 2026, 3:42 PM"
 *   shortDate     : "23 Apr 2026"
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(isoDate) {
  if (!isoDate) return "";

  const date = new Date(isoDate);
  const now = new Date();
  const diff = now - date;

  if (diff < MINUTE) {
    return "Just now";
  }
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return `${mins} min${mins === 1 ? "" : "s"} ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (diff < 2 * DAY) {
    return "Yesterday";
  }
  if (diff < 7 * DAY) {
    const days = Math.floor(diff / DAY);
    return `${days} days ago`;
  }

  // More than a week — show the date
  return shortDate(isoDate);
}

export function shortDate(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fullDate(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}