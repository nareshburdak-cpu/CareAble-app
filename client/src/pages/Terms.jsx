/**
 * Terms — Terms of Service page
 * Redesigned to match app design system:
 *   - indigo-600/700 primary, purple accents, stone neutrals
 *   - Sticky sidebar TOC (mirrors Privacy page)
 *   - Hero with eyebrow pill + SVG underline
 *   - Section number badges + highlight boxes
 *   - Industry-grade content structure
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import BRAND from "../constants/brand";

/* ─── sections data ──────────────────────────────────────────────── */
const SECTIONS = [
  { id: "s1",  title: "Eligibility" },
  { id: "s2",  title: "Honest Self-Assessment" },
  { id: "s3",  title: "Your Account" },
  { id: "s4",  title: "Certificates" },
  { id: "s5",  title: "Acceptable Use" },
  { id: "s6",  title: "Research Participation" },
  { id: "s7",  title: "Intellectual Property" },
  { id: "s8",  title: "Service Availability" },
  { id: "s9",  title: "Limitation of Liability" },
  { id: "s10", title: "Changes to These Terms" },
  { id: "s11", title: "Governing Law" },
  { id: "s12", title: "Contact" },
];

/* ─── scroll helper ──────────────────────────────────────────────── */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─── section wrapper ────────────────────────────────────────────── */
function Section({ id, number, title, children }) {
  return (
    <div id={id} className="scroll-mt-8">
      <div className="flex items-start gap-4 mb-3">
        <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
          {number}
        </span>
        <h2 className="font-serif text-xl font-bold text-stone-900 leading-snug">{title}</h2>
      </div>
      <div className="ml-11 text-stone-600 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

/* ─── highlight box ──────────────────────────────────────────────── */
function HighlightBox({ icon, color, children }) {
  const styles = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-900",
    amber:  "bg-amber-50 border-amber-200 text-amber-900",
    green:  "bg-emerald-50 border-emerald-200 text-emerald-900",
    red:    "bg-red-50 border-red-200 text-red-900",
  };
  return (
    <div className={`flex gap-3 p-4 rounded-xl border text-sm leading-relaxed ${styles[color]}`}>
      <span className="text-lg shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

/* ─── check / cross list ─────────────────────────────────────────── */
function CrossList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="shrink-0 mt-0.5 text-red-500 text-base">✕</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── main component ─────────────────────────────────────────────── */
function Terms() {
  const lastUpdated   = "April 2026";
  const effectiveDate = "1 April 2026";
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div className="flex-1 bg-gradient-to-b from-stone-50 via-white to-stone-50">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-stone-100 py-14 md:py-20">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)" }}
        />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium text-indigo-800 uppercase tracking-wide">
              Terms of Service
            </span>
          </div>

          {/* Headline + SVG underline */}
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 leading-tight mb-4">
            Fair use,{" "}
            <span className="italic text-indigo-700 relative inline-block">
              plainly stated.
              <svg className="absolute -bottom-1 left-0 w-full h-2.5" viewBox="0 0 200 10" preserveAspectRatio="none">
                <path d="M2 7 Q 50 2, 100 6 T 198 5" stroke="#A855F7" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="text-stone-500 text-sm mb-6">
            Effective date: {effectiveDate} · Last updated: {lastUpdated}
          </p>

          {/* Summary badges */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: "🤝", label: "Fair use only" },
              { icon: "🎓", label: "Not formal qualifications" },
              { icon: "🔬", label: "Research project" },
              { icon: "🇦🇺", label: "Australian law applies" },
            ].map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-full text-xs font-medium text-stone-700"
              >
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BODY ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

          {/* ── SIDEBAR TOC ─────────────────────────────────────────── */}
          <aside className="w-full lg:w-56 shrink-0 lg:sticky lg:top-8">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400 font-semibold mb-3">
              Contents
            </p>
            <nav className="space-y-1">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { scrollTo(s.id); setActiveSection(s.id); }}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === s.id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  <span className="shrink-0 w-5 text-center text-xs text-stone-400 font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </button>
              ))}
            </nav>

            {/* Quick contact box */}
            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <p className="text-xs font-semibold text-indigo-800 mb-1">Questions about these terms?</p>
              <p className="text-xs text-indigo-700 mb-2 leading-snug">We're happy to explain anything in plain English.</p>
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="inline-block text-xs font-semibold text-indigo-600 hover:underline"
              >
                {BRAND.supportEmail} →
              </a>
            </div>
          </aside>

          {/* ── MAIN CONTENT ────────────────────────────────────────── */}
          <article className="flex-1 min-w-0 space-y-10 divide-y divide-stone-100">

            {/* Plain-language summary */}
            <HighlightBox icon="💡" color="indigo">
              <strong>Plain-language summary:</strong> Use {BRAND.name} honestly, keep your account secure, and don't misuse the platform or misrepresent your certificate. This is a research project — certificates reflect self-reported capability, not formal qualifications.
            </HighlightBox>

            {/* 1 */}
            <Section id="s1" number="1" title="Eligibility">
              <p>
                {BRAND.name} is intended for adults aged <strong>18 or over</strong> who self-identify as informal caregivers — including family members, friends, or neighbours providing unpaid support to someone they care for.
              </p>
              <p>
                By creating an account and using the platform, you confirm that you meet this requirement and that the information you provide is accurate and truthful.
              </p>
            </Section>

            {/* 2 */}
            <Section id="s2" number="2" title="Honest Self-Assessment">
              <p>
                The value of {BRAND.name} depends entirely on honest self-reflection. Our assessment is designed to recognise genuine caregiving experience — not to be gamed.
              </p>
              <HighlightBox icon="✍️" color="green">
                Answer questions based on your real caregiving experience. Inflated or fabricated responses undermine the validity of your results and any certificate generated from them.
              </HighlightBox>
              <p>
                We reserve the right to revoke certificates where there is evidence of deliberate misrepresentation.
              </p>
            </Section>

            {/* 3 */}
            <Section id="s3" number="3" title="Your Account">
              <p>
                You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
              </p>
              <p>
                Please notify us immediately at{" "}
                <a href={`mailto:${BRAND.supportEmail}`} className="text-indigo-600 hover:underline">
                  {BRAND.supportEmail}
                </a>{" "}
                if you suspect unauthorised access to your account.
              </p>
              <p>
                Each person may hold only one account. Creating multiple accounts to manipulate assessment results is a breach of these terms and may result in all accounts being suspended.
              </p>
            </Section>

            {/* 4 */}
            <Section id="s4" number="4" title="Certificates">
              <p>
                Certificates issued by {BRAND.name} are a <strong>recognition tool</strong>. They represent a structured self-assessment of caregiving capabilities aligned with the Australian Skills Classification.
              </p>
              <HighlightBox icon="⚠️" color="amber">
                <strong>Important:</strong> A {BRAND.name} certificate is <em>not</em> a formal qualification, professional registration, industry licence, or government-recognised credential. It should not be represented as such to employers, licensing bodies, or government agencies.
              </HighlightBox>
              <p>
                Certificates contain a unique verification ID and can be verified at{" "}
                <Link to="/verify" className="text-indigo-600 hover:underline">careable.site/verify</Link>.
                Employers and other parties can independently confirm the authenticity of a certificate using this tool.
              </p>
            </Section>

            {/* 5 */}
            <Section id="s5" number="5" title="Acceptable Use">
              <p>
                You agree to use {BRAND.name} only for its intended purpose. The following are strictly prohibited:
              </p>
              <CrossList items={[
                "Creating multiple accounts to manipulate assessment scores or generate additional certificates",
                "Reverse-engineering, decompiling, or attempting to extract the platform's source code or algorithms",
                "Scraping, copying, or republishing platform content (questions, results, UI) without written permission",
                "Misrepresenting your certificate to deceive employers, agencies, licensing bodies, or other individuals",
                "Using the platform to harass, impersonate, or harm others",
                "Uploading malicious code, scripts, or content designed to disrupt the platform",
              ]} />
            </Section>

            {/* 6 */}
            <Section id="s6" number="6" title="Research Participation">
              <p>
                {BRAND.name} is a research and development project conducted in partnership with{" "}
                <strong>{BRAND.university}</strong> and <strong>{BRAND.centre}</strong>.
              </p>
              <p>
                By using the platform, you may contribute to research into informal caregiving in Australia. Any data used for research is:
              </p>
              <ul className="space-y-2">
                {[
                  "Fully anonymised — your name and email are never included in research outputs",
                  "Aggregated — individual responses are never identifiable",
                  "Used only for academic research aligned with the project's stated goals",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5 text-indigo-600 text-base">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                You can opt out of research participation at any time by deleting your account from your{" "}
                <Link to="/profile" className="text-indigo-600 hover:underline">Profile</Link> page.
              </p>
            </Section>

            {/* 7 */}
            <Section id="s7" number="7" title="Intellectual Property">
              <p>
                All content on {BRAND.name} — including the assessment framework, question design, scoring methodology, UI design, and written content — is owned by the project team and its academic partners.
              </p>
              <p>
                Your assessment responses and certificate remain <strong>yours</strong>. You retain full ownership of the data you submit and the certificates generated from it.
              </p>
              <p>
                You may share your certificate publicly (e.g. on LinkedIn or a CV) for legitimate personal and professional purposes.
              </p>
            </Section>

            {/* 8 */}
            <Section id="s8" number="8" title="Service Availability">
              <p>
                {BRAND.name} is provided <strong>"as is"</strong> during this research and development phase. We make no warranty that the platform will be uninterrupted, error-free, or available at all times.
              </p>
              <p>
                We will aim to provide notice of planned maintenance or downtime where possible. In-progress assessments should be completed in a single session to avoid data loss.
              </p>
            </Section>

            {/* 9 */}
            <Section id="s9" number="9" title="Limitation of Liability">
              <p>
                To the maximum extent permitted by Australian law, {BRAND.name}, its academic partners, and project team members are not liable for:
              </p>
              <ul className="space-y-2">
                {[
                  "Any employment, educational, or professional outcome — positive or negative — arising from use of the platform or a certificate",
                  "Loss of data due to technical failures, account deletion, or platform discontinuation",
                  "Third-party reliance on or misinterpretation of a certificate",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <span className="shrink-0 mt-0.5 text-stone-400 text-base">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* 10 */}
            <Section id="s10" number="10" title="Changes to These Terms">
              <p>
                These terms may be updated as the platform evolves. When we make material changes, we will:
              </p>
              <ul className="space-y-2">
                {[
                  "Update the effective date at the top of this page",
                  "Notify registered users by email at least 14 days before changes take effect",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5 text-indigo-600 text-base">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                Continued use of {BRAND.name} after the effective date constitutes acceptance of the updated terms.
              </p>
            </Section>

            {/* 11 */}
            <Section id="s11" number="11" title="Governing Law">
              <p>
                These terms are governed by the laws of the <strong>State of Victoria, Australia</strong>. Any disputes arising from use of {BRAND.name} will be subject to the exclusive jurisdiction of Victorian courts.
              </p>
              <p>
                Nothing in these terms limits any rights you have under the Australian Consumer Law.
              </p>
            </Section>

            {/* 12 */}
            <Section id="s12" number="12" title="Contact">
              <p>For questions, concerns, or feedback about these terms:</p>
              <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl mt-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">Terms enquiries</p>
                  <a
                    href={`mailto:${BRAND.supportEmail}`}
                    className="text-sm text-indigo-600 hover:underline font-medium"
                  >
                    {BRAND.supportEmail}
                  </a>
                  <p className="text-xs text-stone-500 mt-0.5">We aim to respond within 2 business days.</p>
                </div>
              </div>
            </Section>

            {/* Footer note */}
            <div className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                <p className="text-xs text-stone-500 leading-relaxed">
                  These are working terms for the {BRAND.name} platform, a research and development project under {BRAND.partnersLine} (La Trobe University Capstone 2026). Formally reviewed terms will be issued before any public commercial release.
                </p>
                <div className="flex gap-3 shrink-0">
                  <Link to="/privacy" className="text-xs font-semibold text-indigo-600 hover:underline whitespace-nowrap">
                    Privacy Policy →
                  </Link>
                </div>
              </div>
            </div>

          </article>
        </div>
      </div>
    </div>
  );
}

export default Terms;