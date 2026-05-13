/**
 * Brand Constants
 * ---------------
 * Single source of truth for all CareAble brand strings and colours.
 * 🚨 If you change `tagline`, also update client/index.html
 */

export const BRAND = {
  // Core identity
  name: "CareAble",
  text: "CareAble",
  tagline: "Supporting hidden caregiving workers",
  shortDescription:
    "Self-assess your caregiving skills, aligned with the Australian Skills Classification.",
  longDescription:
    "CareAble helps unpaid carers — family members, friends, and neighbours — recognise and celebrate their caregiving skills. Get a personalised capability report and a professional digital certificate.",

  // Version (manually bump this on releases)
  version: "0.13.0",   // Phase 13 = v0.13

  // Contact email (used on Contact page)
  supportEmail: "hello@careable.site",

  // Partners
  university: "La Trobe University",
  centre: "ACAMI",
  partnersLine: "La Trobe University × Team NEXA",

  // Legal / footer
  copyrightYear: new Date().getFullYear(),
  copyrightLine: `© ${new Date().getFullYear()} La Trobe University × Team NEXA`,

  // URLs
  domain: "careable.site",
  url: "https://careable.site",

  // Symbols
  emoji: "🫶",

  // Brand colours — extracted from official logo SVG
  // Use these in BrandWordmark and anywhere else brand colour is needed
  colors: {
    care: "#40aa9b",   // teal  — "Care" half of wordmark
    able: "#2c6bc2",   // blue  — "Able" half of wordmark
  },

  // Wordmark font stack — Century Gothic with safe fallbacks
  fontStack: "'Century Gothic', 'Gill Sans', 'Trebuchet MS', Futura, sans-serif",
};

// Convenience exports
export const TAGLINE = BRAND.tagline;
export const APP_NAME = BRAND.name;

// Marketing content for landing page
export const TRUST_STATS = [
  { number: "30", label: "Caregiving capabilities measured" },
  { number: "6", label: "Skill categories" },
  { number: "10–15", label: "Minutes to complete", suffix: "min" },
];

export const FEATURES = [
  {
    icon: "compass",
    title: "Self-discovery, made simple",
    desc: "A guided 30-question journey across six caregiving capability areas. Built with experts at La Trobe University.",
  },
  {
    icon: "certificate",
    title: "Recognised digital certificate",
    desc: "Aligned with the Australian Skills Classification — ready to share with employers, agencies, or in your portfolio.",
  },
  {
    icon: "chart",
    title: "Visual capability heatmap",
    desc: "See your strengths at a glance with an interactive radar chart. Spot growth areas without judgment.",
  },
  {
    icon: "shield",
    title: "Private and secure",
    desc: "Your assessment is yours alone. No data selling, no third parties — bank-grade encryption.",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Sign up in seconds",
    desc: "Just your name and email. No lengthy forms, no surveys.",
  },
  {
    n: "02",
    title: "Take the self-assessment",
    desc: "Reflect on your caregiving across six areas. Pause and resume anytime — it auto-saves.",
  },
  {
    n: "03",
    title: "Discover your strengths",
    desc: "An instant capability report shows your top skills and growth areas with personalised insights.",
  },
  {
    n: "04",
    title: "Download your certificate",
    desc: "A professional PDF certificate, uniquely numbered, ready to share or print.",
  },
];

export default BRAND;