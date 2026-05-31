// client/src/constants/brand.js

/**
 * Brand Constants
 * ---------------
 * Single source of truth for all CareAble brand strings and colours.
 * 🚨 If you change `tagline`, also update client/index.html
 */
import naresh from "../assets/team/naresh.png";
import sora from "../assets/team/sora.png";
import Phu from "../assets/team/Phu.png";
import shivanshi from "../assets/team/shivanshi.png";
import acami from "../assets/partners/acami.jpg";
import la_trobe from "../assets/partners/la_trobe.jpg";
import coming from "../assets/partners/coming.png";



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
  version: "0.13.0",

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
  { number: "12", label: "Capability domains assessed" },
  { number: "60+", label: "Questions across all domains" },
  { number: "10–15", label: "Minutes to complete", suffix: "min" },
];

export const FEATURES = [
  {
    icon: "compass",
    title: "12 capability domains",
    desc: "A guided 60-question journey across 12 caregiving capability areas — from communication and advocacy to digital literacy and leadership. Built with experts at La Trobe University.",
  },
  {
    icon: "certificate",
    title: "Recognised digital certificate",
    desc: "Aligned with the Australian Skills Classification — ready to share with employers, agencies, or in your portfolio. Each certificate has a unique ID and QR code for instant verification.",
  },
  {
    icon: "chart",
    title: "Visual capability report",
    desc: "See your strengths at a glance with a per-domain score breakdown. Three evidence-based tiers: Strength, Growth, and Support — spot growth areas without judgment.",
  },
  {
    icon: "shield",
    title: "Private and secure",
    desc: "Your assessment is yours alone. No data selling, no third parties — data stored in Sydney, Australia. Employers can only verify a certificate ID you choose to share.",
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
    desc: "Reflect on your caregiving across 12 capability domains. Pause and resume anytime — your progress is auto-saved.",
  },
  {
    n: "03",
    title: "Discover your strengths",
    desc: "An instant capability report shows your score in each domain, your overall level (Strength, Growth, or Support), and your top areas.",
  },
  {
    n: "04",
    title: "Download your certificate",
    desc: "A professional PDF certificate with a unique ID and QR code — ready to share with employers or add to your portfolio.",
  },
];

// client/src/constants/brand.js — add before `export default BRAND`

// client/src/constants/brand.js — replace PARTNERS and TEAM exports

export const PARTNERS = [
  {
    name: "La Trobe University",
    abbr: "LTU",
    description: "Lead academic partner and project sponsor. Home of ACAMI — the Australian Centre for Applied Medical Informatics.",
    url: "https://www.latrobe.edu.au",
    logo: la_trobe,
    bgColor: "bg-red-600",
    confirmed: true,
  },
  {
    name: "ACAMI",
    abbr: "ACAMI",
    description: "Australian Centre for Applied Medical Informatics — driving research into digital health and care workforce capability.",
    url: "https://www.latrobe.edu.au",
    logo: acami,
    bgColor: "bg-blue-700",
    confirmed: true,
  },
  { name: "Upcoming Partners", abbr: "PO3", description: "Coming soon.", url: null, logo: coming, bgColor: "bg-stone-400", confirmed: true },
  { name: "Upcoming Partners", abbr: "PO4", description: "Coming soon.", url: null, logo: coming, bgColor: "bg-stone-400", confirmed: true },
  { name: "Upcoming Partners", abbr: "PO5", description: "Coming soon.", url: null, logo: coming, bgColor: "bg-stone-400", confirmed: true },
  { name: "Partner Organisation", abbr: "PO6", description: "Coming soon.", url: null, logo: null, bgColor: "bg-stone-400", confirmed: false },
  { name: "Partner Organisation", abbr: "PO7", description: "Coming soon.", url: null, logo: null, bgColor: "bg-stone-400", confirmed: false },
  { name: "Partner Organisation", abbr: "PO8", description: "Coming soon.", url: null, logo: null, bgColor: "bg-stone-400", confirmed: false },
];

export const TEAM = [
  {
    name: "Dr. Phu Lai",
    role: "Research Fellow",
    org: "ACAMI · La Trobe University",
    bio: "Research fellow at ACAMI specialising in digital health, care workforce capability, and applied medical informatics.",
    initials: "PL",
    photo: Phu,
    gradient: "from-indigo-500 to-purple-600",
    confirmed: true,
  },
  {
    name: "Dr. Sora Lee",
    role: "Lecturer, Public Health & Ageing",
    org: "School of Psychology and Public Health",
    bio: "Lecturer specialising in public health and ageing. Brings expertise in caregiver wellbeing and workforce recognition frameworks.",
    initials: "SL",
    photo: sora,
    gradient: "from-purple-500 to-pink-500",
    confirmed: true,
  },
  {
    name: "Naresh Kumar",
    role: "Development Team Leader",
    org: "La Trobe University",
    bio: "Team leader and responsible for design, development, and delivery of the platform.",
    initials: "NK",
    photo: naresh,
    gradient: "from-teal-500 to-indigo-500",
    confirmed: true,
  },
  { name: "Shivanshi Joon",
    role: "Team member", 
    org: "La Trobe University", 
    bio: "Network and security specialist", 
    initials: "SJ", 
    photo: shivanshi, 
    gradient: "from-stone-300 to-stone-400", 
    confirmed: true,
  },
  { name: "Team Member", role: "Placeholder", org: "Organisation", bio: "Coming soon.", initials: "TM", photo: null, gradient: "from-stone-300 to-stone-400", confirmed: true },
  { name: "Team Member", role: "Placeholder", org: "Organisation", bio: "Coming soon.", initials: "TM", photo: null, gradient: "from-stone-300 to-stone-400", confirmed: false },
  { name: "Team Member", role: "Placeholder", org: "Organisation", bio: "Coming soon.", initials: "TM", photo: null, gradient: "from-stone-300 to-stone-400", confirmed: false },
];
export default BRAND;