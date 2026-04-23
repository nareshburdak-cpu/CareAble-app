/**
 * Category Metadata
 * -----------------
 * Single source of truth for category display info.
 * Used by both backend (seed + results) and frontend (UI rendering).
 */

const CATEGORIES = {
  "personal-care": {
    label: "Personal Care",
    description: "Assistance with daily personal tasks like bathing, dressing, and mobility.",
    icon: "🛁",
    color: "indigo",
  },
  "health-management": {
    label: "Health Management",
    description: "Managing medications, appointments, and monitoring health symptoms.",
    icon: "💊",
    color: "pink",
  },
  "emotional-support": {
    label: "Emotional Support",
    description: "Providing emotional comfort, active listening, and companionship.",
    icon: "💬",
    color: "purple",
  },
  "household-tasks": {
    label: "Household Tasks",
    description: "Practical support like cooking, shopping, and maintaining the home.",
    icon: "🏠",
    color: "amber",
  },
  "navigation-advocacy": {
    label: "Navigation & Advocacy",
    description: "Dealing with services, insurance, and medical systems on their behalf.",
    icon: "🧭",
    color: "teal",
  },
  "self-care-resilience": {
    label: "Self-Care & Resilience",
    description: "Looking after your own wellbeing as a carer.",
    icon: "🌱",
    color: "green",
  },
};

module.exports = CATEGORIES;