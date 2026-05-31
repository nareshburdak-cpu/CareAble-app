/**
 * About — Mission & team page
 * Structure: first redesign (editorial warm-humanist)
 * Colors: updated to match Home.jsx (indigo-600/700 primary, purple accents, stone neutrals)
 */

import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import BRAND from "../constants/brand";

/* ─── tiny animation helper ─────────────────────────── */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── reusable fade-in section ───────────────────────── */
function FadeSection({ children, delay = 0, className = "" }) {
  const ref = useFadeIn();
  return (
    <div
      ref={ref}
      className={`fade-section ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── stat pill ──────────────────────────────────────── */
function StatPill({ number, label }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-5 bg-white rounded-2xl border border-stone-200 shadow-sm min-w-[120px]">
      <span className="font-serif text-3xl font-bold text-indigo-700 leading-none">
        {number}
      </span>
      <span className="text-xs text-stone-500 text-center leading-snug">{label}</span>
    </div>
  );
}

/* ─── value card ─────────────────────────────────────── */
function ValueCard({ icon, title, body }) {
  return (
    <div className="group flex gap-5 p-6 bg-white rounded-2xl border border-stone-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="shrink-0 w-11 h-11 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-stone-900 mb-1">{title}</h3>
        <p className="text-sm text-stone-600 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

/* ─── pull quote ─────────────────────────────────────── */
function PullQuote({ children }) {
  return (
    <blockquote className="relative my-10 pl-8 border-l-4 border-indigo-400">
      <span className="absolute -top-3 -left-2 text-5xl text-indigo-200 font-serif leading-none select-none">
        "
      </span>
      <p className="font-serif text-xl md:text-2xl text-stone-700 italic leading-snug">
        {children}
      </p>
    </blockquote>
  );
}

/* ─── main component ─────────────────────────────────── */
function About() {
  return (
    <>
      {/* Scoped animation styles */}
      <style>{`
        .fade-section {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .fade-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <div className="flex-1 bg-gradient-to-b from-stone-50 via-white to-stone-50">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white border-b border-stone-100">

          {/* Decorative blobs — matches Home hero exactly */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)" }}
            />
            <div
              className="absolute top-1/2 -left-32 w-[380px] h-[380px] rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)" }}
            />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12 md:gap-16">

            {/* Text side */}
            <div className="flex-1 text-center md:text-left">

              {/* Eyebrow pill — matches Home exactly */}
              <FadeSection>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs font-medium text-indigo-800 uppercase tracking-wide">
                    About {BRAND.name} · {BRAND.partnersLine}
                  </span>
                </div>
              </FadeSection>

              {/* Headline + SVG underline — matches Home h1 pattern */}
              <FadeSection delay={80}>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-[1.1] mb-6">
                  Recognising the work{" "}
                  <br className="hidden md:block" />
                  <span className="italic text-indigo-700 relative inline-block">
                    that often goes unseen.
                    <svg
                      className="absolute -bottom-2 left-0 w-full h-3"
                      viewBox="0 0 400 12"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M2 8 Q 100 2, 200 7 T 398 6"
                        stroke="#A855F7"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h1>
              </FadeSection>

              <FadeSection delay={160}>
                <p className="text-lg text-stone-600 leading-relaxed max-w-lg mx-auto md:mx-0 mb-8">
                  {BRAND.name} is built for unpaid carers — the family members,
                  friends, and neighbours who provide everyday support to someone
                  they love, without ever calling it a skill.
                </p>
              </FadeSection>

              {/* CTAs — rounded-full, matches Home button style */}
              <FadeSection delay={220}>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30 hover:shadow-xl text-sm"
                  >
                    Discover your skills
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 px-6 py-3.5 border border-stone-300 text-stone-700 font-medium rounded-full hover:border-indigo-400 hover:text-indigo-700 transition bg-white text-sm"
                  >
                    Get in touch
                  </Link>
                </div>
                <p className="text-xs text-stone-500 mt-4 text-center md:text-left">
                  ✓ Free · ✓ Takes 10–15 minutes · ✓ Instant results
                </p>
              </FadeSection>
            </div>

            {/* Stats side */}
            <FadeSection delay={300} className="shrink-0">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <StatPill number="12"   label="Capability domains" />
                <StatPill number="36+"  label="Questions assessed" />
                <StatPill number="10–15" label="Minutes to complete" />
                <StatPill number="1"    label="Certificate for life" />
              </div>
            </FadeSection>
          </div>
        </section>

        {/* ── TRUST STRIP — mirrors Home TrustStrip ────────────── */}
        <section className="border-y border-stone-200 bg-stone-50/60 py-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { number: "2.65M", label: "Unpaid carers in Australia" },
                { number: "12",    label: "Capability domains assessed" },
                { number: "10–15", label: "Minutes to complete", suffix: "min" },
                { number: "100%",  label: "Free for carers, always" },
              ].map((stat) => (
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

        {/* ── THE PROBLEM ──────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <FadeSection>
            <PullQuote>
              They burn out without ever knowing why — because no one told them
              what they were doing was skilled.
            </PullQuote>
          </FadeSection>

          <FadeSection delay={80}>
            <p className="text-stone-700 leading-relaxed mb-4">
              Informal carers provide billions of hours of support every year
              across Australia. They manage medications, navigate complex
              healthcare systems, provide emotional support, and maintain
              households — often all at once.
            </p>
          </FadeSection>

          <FadeSection delay={140}>
            <p className="text-stone-700 leading-relaxed">
              Yet when asked about their skills in a job interview, most carers
              draw a blank. The system doesn't have a language for what they do.
              We built one.
            </p>
          </FadeSection>
        </section>

        {/* ── MISSION — indigo gradient band, matches Home FinalCTA ─ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 pointer-events-none" />
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
          <div
            className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(236,72,153,0.4), transparent 70%)" }}
          />
          <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20">
            <FadeSection>
              <p className="text-xs uppercase tracking-[0.22em] text-indigo-200 font-semibold mb-4">
                Our Mission
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                Turn lived experience into{" "}
                <span className="italic text-indigo-200">recognised capability.</span>
              </h2>
              <p className="text-indigo-100/90 leading-relaxed text-lg max-w-2xl">
                Through a self-paced assessment aligned with the{" "}
                <strong className="text-white">
                  Australian Skills Classification
                </strong>
                , we help hidden carers recognise, validate, and showcase the
                extraordinary skills they've built through care.
              </p>
            </FadeSection>
          </div>
        </section>

        {/* ── VALUES — mirrors Home Features section ────────────── */}
        <section className="py-20 md:py-28 bg-stone-50/60 border-y border-stone-200">
          <div className="max-w-4xl mx-auto px-4">
            <FadeSection>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-medium mb-3">
                What We Stand For
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-8 leading-tight">
                Built for carers,<br />
                <span className="italic text-purple-600">by people who care.</span>
              </h2>
            </FadeSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "🫶",
                  title: "Recognition first",
                  body: "Every assessment starts from a place of strength — we measure what carers can do, not what they lack.",
                },
                {
                  icon: "🔒",
                  title: "Privacy by default",
                  body: "Your answers are yours. We never share identifiable data with employers, agencies, or third parties.",
                },
                {
                  icon: "📋",
                  title: "Evidence-backed",
                  body: "Built from co-design research with real carers and aligned to the Australian Skills Classification.",
                },
                {
                  icon: "🌱",
                  title: "Growth-oriented",
                  body: "Results are framed around development, not deficit. Scores reveal a path forward, not a verdict.",
                },
              ].map((v, i) => (
                <FadeSection key={v.title} delay={i * 60}>
                  <ValueCard {...v} />
                </FadeSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── PARTNERSHIP — mirrors Home Partners section ───────── */}
        <section className="bg-white border-y border-stone-200">
          <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
            <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-start">

              {/* Left: text */}
              <FadeSection className="flex-1">
                <p className="text-xs uppercase tracking-[0.22em] text-indigo-700 font-semibold mb-2">
                  Built In Partnership
                </p>
                <h2 className="font-serif text-3xl font-bold text-stone-900 mb-4 leading-tight">
                  Research-led, community-driven.
                </h2>
                <p className="text-stone-600 leading-relaxed mb-4">
                  {BRAND.name} is a research and development project in
                  partnership with{" "}
                  <strong className="text-stone-900">{BRAND.university}</strong>{" "}
                  and{" "}
                  <strong className="text-stone-900">{BRAND.centre}</strong>{" "}
                  (Australian Centre for Ageing, Migration & Inclusion).
                </p>
                <p className="text-stone-600 leading-relaxed">
                  The platform draws on evidence from co-design workshops with
                  real carers and is designed to support both individual
                  self-recognition and broader academic research into informal
                  caregiving in Australia.
                </p>
              </FadeSection>

              {/* Right: partner chips — same card style as Home Partners */}
              <FadeSection delay={100} className="shrink-0 flex flex-col gap-3 w-full md:w-64">
                {[
                  { short: "LTU",   name: "La Trobe University",   role: "Academic partner",      color: "bg-red-600" },
                  { short: "ACAMI", name: "Australian Centre for Ageing, Migration & Inclusion", role: "Research partner", color: "bg-blue-700" },
                  { short: "NEXA",  name: "Team NEXA",              role: "Product & engineering", color: "bg-indigo-600" },
                ].map((p) => (
                  <div
                    key={p.short}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 hover:border-indigo-300 hover:shadow-md transition-all shadow-sm"
                  >
                    <div className={`shrink-0 w-12 h-12 rounded-lg ${p.color} text-white font-bold text-sm flex items-center justify-center`}>
                      {p.short}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-sm leading-tight">
                        {p.name}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">{p.role}</p>
                    </div>
                  </div>
                ))}
                <p className="text-center text-xs text-stone-400 mt-1">
                  Interested in partnering?{" "}
                  <Link to="/contact" className="text-indigo-600 hover:underline">
                    Get in touch →
                  </Link>
                </p>
              </FadeSection>
            </div>
          </div>
        </section>

        {/* ── WHAT'S NEXT — mirrors Home HowItWorks numbered cards ─ */}
        <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
          <FadeSection>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-medium mb-3">
              What's Next
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-4 leading-tight">
              We're actively iterating —{" "}
              <span className="italic text-purple-600">and just getting started.</span>
            </h2>
            <p className="text-stone-600 leading-relaxed mb-8">
              The platform is live in production and improving every week with carers,
              employers, and academic partners.
            </p>
          </FadeSection>

          <FadeSection delay={80}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { n: "01", icon: "🌏", label: "Localisation for culturally diverse carers" },
                { n: "02", icon: "🗺️", label: "Deeper skills mapping across ASC domains" },
                { n: "03", icon: "🏢", label: "Verification tools for employers & education providers" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white border border-stone-200 rounded-2xl p-6 flex gap-4 hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="font-serif text-4xl font-bold text-indigo-100 leading-none flex-shrink-0">
                    {item.n}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-sm text-stone-700 leading-snug font-medium">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeSection>
        </section>

        {/* ── FINAL CTA — exact same as Home FinalCTA ──────────── */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 pointer-events-none" />
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
          <div
            className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(236,72,153,0.4), transparent 70%)" }}
          />
          <FadeSection>
            <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
              <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Ready to discover<br />
                <span className="italic text-indigo-200">who you really are?</span>
              </h2>
              <p className="text-lg text-indigo-100/90 mb-10 max-w-xl mx-auto">
                Free. Private. Takes 10–15 minutes. Walk away with a personalised
                report and a professional certificate.
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
            </div>
          </FadeSection>
        </section>

      </div>
    </>
  );
}

export default About;