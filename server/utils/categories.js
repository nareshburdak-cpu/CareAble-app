// server/utils/categories.js

/**
 * Category Metadata
 * -----------------
 * Single source of truth for the 12 capability domains defined in the
 * Capstone Brief (Appendix 3). Used by:
 *   - server/seed/questions.seed.js           (creates questions per domain)
 *   - server/controllers/questionController   (groups questions for /api/questions)
 *   - server/utils/generateCertificate.js     (lists domains on the PDF)
 *   - client/src/components/CapabilityHeatmap (radar chart labels)
 *   - client/src/pages/Results.jsx            (per-domain breakdown)
 *
 * Key order is intentional — matches Appendix 3 ordering (1/12 .. 12/12).
 * Per-assessment randomisation overrides this for individual carers, but
 * this is the default presentation order.
 *
 * To add a new domain later:
 *   1. Pick a kebab-case key (lowercase, '&' dropped, commas dropped)
 *   2. Add the entry below
 *   3. Add 5 questions for it via the admin UI (or seed)
 *   4. Restart the API
 */

const CATEGORIES = {
  "communication-relational-care": {
    label: "Communication & Relational Care",
    description:
      "Understanding others through verbal and non-verbal cues, and communicating with respect and trust.",
    icon: "💬",
    color: "indigo",
  },
  "system-navigation-advocacy": {
    label: "System Navigation & Advocacy",
    description:
      "Navigating health, disability, and support services and advocating effectively on behalf of those you care for.",
    icon: "🧭",
    color: "teal",
  },
  "emotional-resilience-self-regulation": {
    label: "Emotional Resilience & Self-Regulation",
    description:
      "Staying emotionally steady under pressure and recovering well after difficult caregiving experiences.",
    icon: "🌊",
    color: "sky",
  },
  "self-care-energy-management": {
    label: "Self-Care & Energy Management",
    description:
      "Pacing your energy, recognising fatigue early, and protecting your own wellbeing while caring for others.",
    icon: "🌱",
    color: "green",
  },
  "social-connection-belonging": {
    label: "Social Connection & Belonging",
    description:
      "Maintaining relationships and a sense of identity beyond the caregiving role.",
    icon: "🤝",
    color: "rose",
  },
  "group-communication-information-filtering": {
    label: "Group Communication & Information Filtering",
    description:
      "Managing communication across multiple people involved in care and sharing information appropriately.",
    icon: "📣",
    color: "amber",
  },
  "practical-care-safety-awareness": {
    label: "Practical Care & Safety Awareness",
    description:
      "Day-to-day care tasks performed safely, including medication, mobility, and recognising risk.",
    icon: "🛡️",
    color: "red",
  },
  "cultural-spiritual-ethical-practice": {
    label: "Cultural, Spiritual & Ethical Practice",
    description:
      "Respecting cultural, spiritual, and ethical values when providing care.",
    icon: "🕊️",
    color: "violet",
  },
  "adaptability-learning-orientation": {
    label: "Adaptability & Learning Orientation",
    description:
      "Adjusting to change, learning new skills, and reflecting on your caregiving practice.",
    icon: "🧠",
    color: "fuchsia",
  },
  "digital-literacy": {
    label: "Digital Literacy",
    description:
      "Using digital tools, apps, and online services confidently to support care.",
    icon: "💻",
    color: "blue",
  },
  "planning-organisation": {
    label: "Planning & Organisation",
    description:
      "Planning tasks, scheduling appointments, and keeping caregiving routines organised.",
    icon: "📅",
    color: "orange",
  },
  "leadership-coordination": {
    label: "Leadership & Coordination",
    description:
      "Coordinating others, delegating, and taking initiative when caregiving requires leadership.",
    icon: "🎯",
    color: "emerald",
  },
};

module.exports = CATEGORIES;