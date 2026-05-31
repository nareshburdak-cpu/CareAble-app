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
import yogesh from "../assets/team/yogesh.png";
import jayan from "../assets/team/jayan.png";

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

export const PARTNERS = [
{
  name: "La Trobe University",
  abbr: "LTU",
  role: "Academic Partner",
  description: "Lead academic partner. Ranked top 1% globally, renowned for health sciences research and social impact across Victoria.",
  url: "https://www.latrobe.edu.au",
  logo: la_trobe,
  bgColor: "bg-red-600",
  confirmed: true,
},
{
  name: "ACAMI",
  abbr: "ACAMI",
  role: "Research Partner",
  description: "World's first AI medical innovation centre. Backed by $10M in government funding to advance medical research and workforce capability.",
  url: "https://www.latrobe.edu.au/acami",
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

// client/src/constants/brand.js

export const TEAM = [
{
  name: "Dr. Phu Lai",
  role: "Research Fellow",
  org: "ACAMI · La Trobe University",
  bio: "Research fellow at ACAMI, the world's first university centre using AI to advance medical innovation and care workforce capability. Leads the CareAble research initiative at La Trobe.",
  initials: "PL",
  photo: Phu,
  gradient: "from-indigo-500 to-purple-600",
  confirmed: true,
},
{
  name: "Dr. Sora Lee",
  role: "Lecturer, Public Health & Ageing",
  org: "School of Psychology and Public Health",
  bio: "Lecturer at La Trobe University specialising in public health and ageing. Brings research expertise in caregiver wellbeing and workforce recognition to the CareAble project.",
  initials: "SL",
  photo: sora,
  gradient: "from-purple-500 to-pink-500",
  confirmed: true,
},
{
  name: "Naresh Kumar",
  role: "Team Leader & Full-Stack Developer",
  org: "La Trobe University",
  bio: "Led the end-to-end design, development, and deployment of CareAble from database architecture and REST API design to React frontend, cloud infrastructure.",
  initials: "NK",
  photo: naresh,
  gradient: "from-teal-500 to-indigo-500",
  confirmed: true,
},
{
  name: "Shivanshi Joon",
  role: "Security & Backend Developer",
  org: "La Trobe University",
  bio: "Designed and implemented CareAble's authentication system JWT, OAuth2, OTP flows, and role-based access control. Responsible for API security, database schema.",
  initials: "SJ",
  photo: shivanshi,
  gradient: "from-rose-500 to-pink-600",
  confirmed: true,
},
{
  name: "Jayan Sekhar Mallu",
  role: "AI & Data Integration",
  org: "La Trobe University",
  bio: "Contributed to CareAble's AI insights feature and data integration layer. Brings skills in Python, R, and TensorFlow to support data-driven assessment outcomes.",
  initials: "JM",
  photo: jayan,
  gradient: "from-amber-500 to-orange-500",
  confirmed: true,
},
{
  name: "Hema Priya",
  role: "Full-Stack Developer",
  org: "La Trobe University",
  bio: "Contributed across frontend and backend, building responsive UI components, integrating APIs, and supporting authentication flows.",
  initials: "HP",
  photo: null,
  gradient: "from-emerald-500 to-teal-500",
  confirmed: true,
},
{
  name: "Sreenivasulu Reddy",
  role: "Data & Analytics Developer",
  org: "La Trobe University",
  bio: "Built CareAble's analytics dashboards and data visualisations. Manages MongoDB schema design and database performance to support assessment scoring and reporting.",
  initials: "SR",
  photo: null,
  gradient: "from-blue-500 to-indigo-500",
  confirmed: true,
},
{
  name: "Yogesh Tajane",
  role: "QA & Documentation Lead",
  org: "La Trobe University",
  bio: "Responsible for platform quality assurance, test case design, and technical documentation. Ensures CareAble meets usability standards and is well-documented for future development.",
  initials: "YT",
  photo: yogesh,
  gradient: "from-violet-500 to-purple-600",
  confirmed: true,
},
];


export default BRAND;
