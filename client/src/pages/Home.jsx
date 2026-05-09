// client/src/pages/Home.jsx

/**
 * Home — Landing page
 * -------------------
 * Phase 12-B polish — aligned with brief A.1:
 *   - Purpose / mission
 *   - Partners (La Trobe, ACAMI + placeholders)
 *   - Team placeholders
 *   - Contact form
 *   - Login button
 *   - Simple, modern, visually appealing
 *
 * Colour palette: indigo-600 primary, purple accents, stone neutrals
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import BRAND, { TRUST_STATS, FEATURES, STEPS } from "../constants/brand";

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex-1 bg-gradient-to-b from-stone-50 via-white to-stone-50">
      <Hero isAuthenticated={isAuthenticated} user={user} />
      <TrustStrip />
      <About />
      <Features />
      <HowItWorks />
      <Partners />
      <Team />
      <Contact />
      <FinalCTA isAuthenticated={isAuthenticated} />
    </div>
  );
}

// =============================================================================
// HERO
// =============================================================================
function Hero({ isAuthenticated, user }) {
  const firstName = user?.name?.split(" ")[0];

  return (
    <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-24">
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)" }}
      />

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-medium text-indigo-800 uppercase tracking-wide">
              {isAuthenticated
                ? "Welcome back to CareAble"
                : `In partnership with ${BRAND.partnersLine}`}
            </span>
          </div>

          {/* Headline */}
          {isAuthenticated ? (
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-stone-900 leading-[1.05] mb-6 tracking-tight">
              Hi, {firstName}.<br />
              <span className="italic text-indigo-700 relative inline-block">
                Ready to continue?
                <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M2 8 Q 50 2, 100 7 T 198 6" stroke="#A855F7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
          ) : (
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-stone-900 leading-[1.05] mb-6 tracking-tight">
              Your caregiving<br />
              <span className="italic text-indigo-700 relative inline-block">
                is a skill.
                <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M2 8 Q 50 2, 100 7 T 198 6" stroke="#A855F7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
          )}

          {/* Subtext */}
          <p className="text-lg md:text-xl text-stone-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            {isAuthenticated
              ? "Pick up where you left off. View your latest report, take a fresh assessment, or download your certificate."
              : "CareAble helps unpaid carers — family, friends, and neighbours — recognise and validate the extraordinary skills they've built. Get a personalised capability report and a professional digital certificate."}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30 hover:shadow-xl"
                >
                  Go to Dashboard
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link
                  to="/assessment"
                  className="px-8 py-3.5 text-stone-700 font-medium hover:text-indigo-700 transition"
                >
                  Take an assessment →
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30 hover:shadow-xl"
                >
                  Get started free
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-6 py-3.5 border border-stone-300 text-stone-700 font-medium rounded-full hover:border-indigo-400 hover:text-indigo-700 transition bg-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Log in
                </Link>
              </>
            )}
          </div>

          <p className="text-xs text-stone-500">
            {isAuthenticated
              ? "Continue your journey — your progress is saved automatically."
              : "✓ Free · ✓ Takes 10–15 minutes · ✓ Instant results"}
          </p>
        </div>

        {/* Sample card */}
        <SampleCard />
      </div>
    </section>
  );
}

// =============================================================================
// HERO SAMPLE CARD
// =============================================================================
function SampleCard() {
  const skills = [
    { name: "Communication", val: "4.8", tier: "Strength", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
    { name: "Emotional Care", val: "4.6", tier: "Strength", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
    { name: "Planning", val: "3.7", tier: "Growth", color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
    { name: "Digital Skills", val: "3.2", tier: "Growth", color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
    { name: "Practical Care", val: "4.5", tier: "Strength", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
    { name: "Adaptability", val: "4.1", tier: "Strength", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  ];

  return (
    <div className="mt-16 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl shadow-indigo-900/10 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-stone-100">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-700 flex items-center justify-center text-white font-semibold">
            SM
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-stone-900">Sarah's Capability Report</p>
            <p className="text-xs text-stone-500">Sample — what you'll receive</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
            ✓ Strength
          </span>
        </div>

        <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-3">
          Capability areas · scored out of 5.00
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {skills.map((s) => (
            <div key={s.name} className={`border rounded-xl px-3 py-3 text-center ${s.color}`}>
              <div className="text-2xl font-bold">{s.val}</div>
              <div className="text-[11px] mt-0.5 leading-tight opacity-80">{s.name}</div>
              <div className="text-[10px] mt-1 font-semibold opacity-60">{s.tier}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-500">
          <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Aligned with the Australian Skills Classification · Overall: 4.2 / 5.00
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TRUST STRIP
// =============================================================================
function TrustStrip() {
  return (
    <section className="border-y border-stone-200 bg-stone-50/60 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center">
          {TRUST_STATS.map((stat) => (
            <div key={stat.label}>
              <div className="font-serif text-4xl md:text-5xl font-bold text-indigo-700 mb-1">
                {stat.number}
                {stat.suffix && (
                  <span className="text-2xl text-stone-500 ml-1">{stat.suffix}</span>
                )}
              </div>
              <p className="text-sm text-stone-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// ABOUT / PURPOSE
// =============================================================================
function About() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Text */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-medium mb-4">
              Our purpose
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-6 leading-tight">
              Millions of Australians provide care every day — but remain invisible to the workforce.
            </h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              Hidden workers are unpaid individuals — often family members or friends — providing essential care for people with disabilities, chronic illnesses, or age-related frailty. They rarely identify as "carers" and therefore rarely access the support and recognition they deserve.
            </p>
            <p className="text-stone-600 leading-relaxed mb-8">
              CareAble is a platform enabling formal recognition of these informal caregiving capabilities, aligned with the Australian Skills Classification and the Care and Support Economy Strategy 2023–2033.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm text-stone-700 font-medium">Recognised skills framework</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-sm text-stone-700 font-medium">Digital certificate issued</span>
              </div>
            </div>
          </div>

          {/* Visual stat block */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: "2.65M", label: "Unpaid carers in Australia", color: "bg-indigo-600 text-white" },
              { num: "12", label: "Capability domains assessed", color: "bg-purple-600 text-white" },
              { num: "Free", label: "Always free for carers", color: "bg-white border border-stone-200 text-stone-900" },
              { num: "ASC", label: "Australian Skills Classification aligned", color: "bg-white border border-stone-200 text-stone-900" },
            ].map((item) => (
              <div key={item.label} className={`${item.color} rounded-2xl p-6 flex flex-col justify-between min-h-[130px]`}>
                <div className="text-3xl font-bold font-serif">{item.num}</div>
                <div className={`text-sm leading-tight mt-3 ${item.color.includes("white") ? "text-stone-500" : "text-white/80"}`}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// FEATURES
// =============================================================================
function Features() {
  return (
    <section className="py-20 md:py-28 bg-stone-50/60 border-y border-stone-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-medium mb-3">
            What we offer
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight">
            Built for carers,<br />by people who care.
          </h2>
          <p className="text-stone-600 leading-relaxed">
            Every feature designed with hidden carers in mind — clear, kind, and grounded in real research.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-white border border-stone-200 rounded-2xl p-6 md:p-8 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center mb-5 transition">
                <FeatureIcon name={f.icon} />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">{f.title}</h3>
              <p className="text-stone-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ name }) {
  const props = {
    className: "w-6 h-6 text-indigo-700",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
  };
  switch (name) {
    case "compass":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14.5 9.5l-1.5 4.5-4.5 1.5 1.5-4.5 4.5-1.5z" /></svg>;
    case "certificate":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M3 6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6zM7 20l3-3M17 20l-3-3" /></svg>;
    case "chart":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
    case "shield":
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
    default:
      return null;
  }
}

// =============================================================================
// HOW IT WORKS
// =============================================================================
function HowItWorks() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-medium mb-3">
            How it works
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight">
            From invisible to{" "}
            <span className="italic text-purple-600">invaluable</span>
            <br />in four simple steps.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 flex gap-6 hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="font-serif text-5xl md:text-6xl font-bold text-indigo-100 leading-none flex-shrink-0">
                {s.n}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">{s.title}</h3>
                <p className="text-stone-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// PARTNERS
// =============================================================================
const PARTNERS = [
  { name: "La Trobe University", abbr: "LTU", color: "bg-red-600", confirmed: true },
  { name: "ACAMI", abbr: "ACAMI", color: "bg-blue-700", confirmed: true },
  { name: "Partner Organisation", abbr: "PO3", color: "bg-stone-400", confirmed: false },
  { name: "Partner Organisation", abbr: "PO4", color: "bg-stone-400", confirmed: false },
  { name: "Partner Organisation", abbr: "PO5", color: "bg-stone-400", confirmed: false },
  { name: "Partner Organisation", abbr: "PO6", color: "bg-stone-400", confirmed: false },
  { name: "Partner Organisation", abbr: "PO7", color: "bg-stone-400", confirmed: false },
];

function Partners() {
  return (
    <section className="py-20 md:py-28 bg-stone-50/60 border-y border-stone-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-medium mb-3">
            Our partners
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            Backed by leading institutions
          </h2>
          <p className="text-stone-600 max-w-xl mx-auto">
            CareAble is developed in collaboration with La Trobe University and supported by partner organisations across the care and research sectors.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PARTNERS.map((p, i) => (
            <div
              key={i}
              className={`bg-white border rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[120px] transition-all ${
                p.confirmed
                  ? "border-stone-200 hover:border-indigo-300 hover:shadow-md"
                  : "border-dashed border-stone-300 opacity-50"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl ${p.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {p.abbr.slice(0, 3)}
              </div>
              <p className={`text-sm font-medium leading-tight ${p.confirmed ? "text-stone-800" : "text-stone-400"}`}>
                {p.name}
              </p>
              {!p.confirmed && (
                <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">
                  Coming soon
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-stone-400 mt-8">
          Interested in partnering with CareAble?{" "}
          <a href="#contact" className="text-indigo-600 hover:underline">Get in touch →</a>
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// TEAM
// =============================================================================
const TEAM = [
  {
    name: "Dr. Phu Lai",
    role: "Research Fellow",
    org: "ACAMI · La Trobe University",
    initials: "PL",
    color: "from-indigo-500 to-purple-600",
    confirmed: true,
  },
  {
    name: "Dr. Sora Lee",
    role: "Lecturer, Public Health & Ageing",
    org: "School of Psychology and Public Health",
    initials: "SL",
    color: "from-purple-500 to-pink-500",
    confirmed: true,
  },
  {
    name: "Team Member",
    role: "Placeholder",
    org: "Organisation",
    initials: "TM",
    color: "from-stone-300 to-stone-400",
    confirmed: false,
  },
  {
    name: "Team Member",
    role: "Placeholder",
    org: "Organisation",
    initials: "TM",
    color: "from-stone-300 to-stone-400",
    confirmed: false,
  },
];

function Team() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-medium mb-3">
            Our team
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-4">
            The people behind CareAble
          </h2>
          <p className="text-stone-600 max-w-xl mx-auto">
            A multidisciplinary team from La Trobe University's research and technology community.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map((member, i) => (
            <div
              key={i}
              className={`bg-white border rounded-2xl p-6 text-center transition-all ${
                member.confirmed
                  ? "border-stone-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-1"
                  : "border-dashed border-stone-200 opacity-50"
              }`}
            >
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-lg mx-auto mb-4`}>
                {member.initials}
              </div>
              <p className={`font-semibold mb-0.5 ${member.confirmed ? "text-stone-900" : "text-stone-400"}`}>
                {member.name}
              </p>
              <p className="text-sm text-indigo-600 font-medium mb-1">{member.role}</p>
              <p className="text-xs text-stone-500 leading-snug">{member.org}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// CONTACT FORM
// =============================================================================
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");

    // Simulate send — connect to real email endpoint if needed
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("sent");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="py-20 md:py-28 bg-stone-50/60 border-y border-stone-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">

          {/* Left copy */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-medium mb-4">
              Contact us
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-6 leading-tight">
              Get in touch
            </h2>
            <p className="text-stone-600 leading-relaxed mb-8">
              Whether you're a carer, employer, researcher, or organisation interested in partnering with CareAble, we'd love to hear from you.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Email</p>
                  <p className="text-sm font-medium text-stone-800">contact@careable.site</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Location</p>
                  <p className="text-sm font-medium text-stone-800">La Trobe University, Melbourne VIC</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
            {status === "sent" ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">Message sent!</h3>
                <p className="text-sm text-stone-500 mb-6">We'll get back to you as soon as possible.</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <FormField
                  label="Your name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  error={errors.name}
                  placeholder="Jane Smith"
                />
                <FormField
                  label="Email address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="you@example.com"
                />
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us how we can help..."
                    className={`block w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none ${
                      errors.message ? "border-red-300 bg-red-50" : "border-stone-300 bg-white"
                    }`}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition shadow-sm inline-flex items-center justify-center gap-2"
                >
                  {status === "sending" ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    "Send message"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FormField({ label, name, type, value, onChange, error, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`block w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
          error ? "border-red-300 bg-red-50" : "border-stone-300 bg-white"
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// =============================================================================
// FINAL CTA
// =============================================================================
function FinalCTA({ isAuthenticated }) {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 pointer-events-none" />
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.4), transparent 70%)" }}
      />
      <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
        {isAuthenticated ? (
          <>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Continue your journey<br />
              <span className="italic text-indigo-200">toward recognition.</span>
            </h2>
            <p className="text-lg text-indigo-100/90 mb-10 max-w-xl mx-auto">
              Take a fresh assessment, or revisit your existing capability report and certificate.
            </p>
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-indigo-50 text-indigo-700 font-medium rounded-full transition shadow-2xl"
            >
              Open Dashboard
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </>
        ) : (
          <>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to discover<br />
              <span className="italic text-indigo-200">who you really are?</span>
            </h2>
            <p className="text-lg text-indigo-100/90 mb-10 max-w-xl mx-auto">
              Join carers across Australia turning their caregiving experience into recognised, professional capability.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-indigo-50 text-indigo-700 font-medium rounded-full transition shadow-2xl"
              >
                Start free assessment
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition backdrop-blur border border-white/20"
              >
                Log in to my account
              </Link>
            </div>
            <p className="text-xs text-indigo-200/70 mt-6">
              No credit card · Takes 10–15 minutes · Instant results
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default Home;