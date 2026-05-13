/**
 * Privacy — Privacy Policy page
 * Redesigned: industry-grade, matches Home.jsx color system
 * (indigo-600/700 primary, purple accents, stone neutrals)
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import BRAND from "../constants/brand";

/* ─── table of contents data ─────────────────────────────── */
const SECTIONS = [
  { id: "s1",  title: "Information We Collect" },
  { id: "s2",  title: "How We Use Your Data" },
  { id: "s3",  title: "What We Don't Do" },
  { id: "s4",  title: "Data Security" },
  { id: "s5",  title: "Your Rights" },
  { id: "s6",  title: "Cookies & Local Storage" },
  { id: "s7",  title: "Data Retention" },
  { id: "s8",  title: "Third-Party Services" },
  { id: "s9",  title: "Changes to This Policy" },
  { id: "s10", title: "Contact & Complaints" },
];

/* ─── scroll helper ──────────────────────────────────────── */
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─── section wrapper ────────────────────────────────────── */
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

/* ─── highlight box ──────────────────────────────────────── */
function HighlightBox({ icon, color, children }) {
  const styles = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-900",
    green:  "bg-emerald-50 border-emerald-200 text-emerald-900",
    amber:  "bg-amber-50 border-amber-200 text-amber-900",
  };
  return (
    <div className={`flex gap-3 p-4 rounded-xl border text-sm leading-relaxed ${styles[color]}`}>
      <span className="text-lg shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

/* ─── check list ─────────────────────────────────────────── */
function CheckList({ items, cross }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className={`shrink-0 mt-0.5 text-base ${cross ? "text-red-500" : "text-indigo-600"}`}>
            {cross ? "✕" : "✓"}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── main component ─────────────────────────────────────── */
function Privacy() {
  const lastUpdated  = "April 2026";
  const effectiveDate = "1 April 2026";
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div className="flex-1 bg-gradient-to-b from-stone-50 via-white to-stone-50">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-stone-100 py-14 md:py-20">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)" }}
        />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs font-medium text-indigo-800 uppercase tracking-wide">
              Privacy Policy
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 leading-tight mb-4">
            Your data,{" "}
            <span className="italic text-indigo-700 relative inline-block">
              your trust.
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
              { icon: "🔒", label: "No data selling" },
              { icon: "🚫", label: "No ads" },
              { icon: "🇦🇺", label: "Stored in Australia" },
              { icon: "🗑️", label: "Delete anytime" },
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

      {/* ── BODY ──────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

          {/* ── SIDEBAR TOC ─────────────────────────────────────── */}
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
              <p className="text-xs font-semibold text-indigo-800 mb-1">Privacy question?</p>
              <p className="text-xs text-indigo-700 mb-2 leading-snug">Contact us and we'll respond within 2 business days.</p>
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="inline-block text-xs font-semibold text-indigo-600 hover:underline"
              >
                {BRAND.supportEmail} →
              </a>
            </div>
          </aside>

          {/* ── MAIN CONTENT ────────────────────────────────────── */}
          <article className="flex-1 min-w-0 space-y-10 divide-y divide-stone-100">

            {/* Plain-language summary */}
            <HighlightBox icon="💡" color="indigo">
              <strong>Plain-language summary:</strong> CareAble collects only what it needs to run your assessment and issue your certificate. We never sell your data, never share it with employers without your explicit action, and never use it for advertising. You can delete everything at any time.
            </HighlightBox>

            {/* 1 */}
            <Section id="s1" number="1" title="Information We Collect">
              <p>
                We collect only the minimum information required to provide the {BRAND.name} service.
                This includes:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {[
                  { icon: "👤", label: "Account information", desc: "Name, email address, and password (hashed — never stored in plain text)." },
                  { icon: "📋", label: "Onboarding details", desc: "Employment status, care context, postcode, and demographic information provided during registration." },
                  { icon: "✏️", label: "Assessment responses", desc: "Your answers to capability domain questions. These are stored securely and linked only to your account." },
                  { icon: "📊", label: "Usage data", desc: "Anonymous page views and error logs used to improve the platform. No personal identifiers attached." },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3 p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{item.label}</p>
                      <p className="text-xs text-stone-500 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-stone-500 mt-2">
                We do not collect sensitive information such as health records, financial data, or government identifiers.
              </p>
            </Section>

            {/* 2 */}
            <Section id="s2" number="2" title="How We Use Your Data">
              <p>Your information is used solely to provide and improve the {BRAND.name} service:</p>
              <CheckList items={[
                "Deliver your personalised capability assessment and results",
                "Generate and issue your digital certificate with a unique verification ID",
                "Send transactional emails (verification, password reset, certificate confirmation)",
                "Improve platform reliability and fix bugs using anonymised error logs",
                "Contribute anonymised, aggregated data to academic research conducted by " + BRAND.university + " and " + BRAND.centre,
              ]} />
              <HighlightBox icon="🔬" color="green">
                <strong>Academic research:</strong> Any data shared with our university partners is fully anonymised and aggregated — individual responses are never identifiable in research outputs.
              </HighlightBox>
            </Section>

            {/* 3 */}
            <Section id="s3" number="3" title="What We Don't Do">
              <p>We want to be explicit about the things we will never do:</p>
              <CheckList cross items={[
                "Sell your personal data to any third party — ever",
                "Share identifiable information with employers or agencies without your explicit action",
                "Use your data for advertising, retargeting, or profiling",
                "Access your assessment responses for any purpose beyond service delivery and anonymised research",
                "Transfer your data outside of Australia without your consent",
              ]} />
            </Section>

            {/* 4 */}
            <Section id="s4" number="4" title="Data Security">
              <p>
                We implement industry-standard security practices across the full stack:
              </p>
              <div className="space-y-2.5 mt-1">
                {[
                  { icon: "🔑", title: "Passwords", desc: "Hashed using bcrypt with a per-user salt. Plaintext passwords are never stored or logged." },
                  { icon: "🪙", title: "Sessions", desc: "Authenticated via signed JSON Web Tokens (JWT) with short expiry windows." },
                  { icon: "🗄️", title: "Database", desc: "Hosted on MongoDB Atlas (Sydney region, Australia). Encrypted at rest and in transit." },
                  { icon: "🌐", title: "Transport", desc: "All connections enforced over HTTPS/TLS. HTTP requests are redirected automatically." },
                  { icon: "📧", title: "Email delivery", desc: "Transactional emails sent via Resend with a verified careable.site domain and SPF/DKIM records." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                    <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <span className="text-sm font-semibold text-stone-800">{item.title}: </span>
                      <span className="text-sm text-stone-600">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <HighlightBox icon="⚠️" color="amber">
                <strong>Important:</strong> While we take security seriously, no internet service can guarantee absolute security. Please use a strong, unique password and enable account verification.
              </HighlightBox>
            </Section>

            {/* 5 */}
            <Section id="s5" number="5" title="Your Rights">
              <p>
                Under Australian Privacy Principles (APPs) and general best practice, you have the following rights:
              </p>
              <CheckList items={[
                "Access — view all data we hold about you via your Profile page",
                "Correction — update your name, email, and profile details at any time",
                "Deletion — permanently delete your account and all associated data from your Profile page",
                "Portability — request a copy of your assessment data by emailing us",
                "Objection — opt out of anonymised research contributions by contacting us",
              ]} />
              <p className="text-sm">
                Account deletion removes all personal data within <strong>30 days</strong>. Anonymised, aggregated research data (with no personal identifiers) may be retained in academic outputs.
              </p>
            </Section>

            {/* 6 */}
            <Section id="s6" number="6" title="Cookies & Local Storage">
              <p>
                {BRAND.name} uses <strong>minimal client-side storage</strong> to function:
              </p>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm border border-stone-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-600 uppercase tracking-wide">Storage type</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-600 uppercase tracking-wide">Purpose</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-600 uppercase tracking-wide">Expires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="px-4 py-3 font-medium text-stone-800">localStorage (token)</td>
                      <td className="px-4 py-3 text-stone-600">Keeps you logged in between sessions</td>
                      <td className="px-4 py-3 text-stone-600">On logout or expiry</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-stone-800">localStorage (activeRole)</td>
                      <td className="px-4 py-3 text-stone-600">Remembers your active role (carer / employer)</td>
                      <td className="px-4 py-3 text-stone-600">On logout</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-stone-500 mt-2">
                We do <strong>not</strong> use marketing cookies, analytics trackers (e.g. Google Analytics), or any third-party advertising cookies.
              </p>
            </Section>

            {/* 7 */}
            <Section id="s7" number="7" title="Data Retention">
              <p>We retain your data for as long as your account is active, or as needed to provide the service:</p>
              <CheckList items={[
                "Active accounts: data retained indefinitely while the account exists",
                "Deleted accounts: personal data purged within 30 days of deletion request",
                "Audit logs: administrative logs retained for 90 days then auto-purged",
                "Anonymised research data: retained in academic outputs with no expiry (not personally identifiable)",
              ]} />
            </Section>

            {/* 8 */}
            <Section id="s8" number="8" title="Third-Party Services">
              <p>
                {BRAND.name} uses a small number of trusted third-party services to operate the platform.
                Each is bound by its own privacy policy:
              </p>
              <div className="space-y-2.5 mt-1">
                {[
                  { name: "MongoDB Atlas",  role: "Database hosting",        region: "Sydney, Australia", data: "All user and assessment data" },
                  { name: "Render",         role: "Backend API hosting",     region: "Oregon, USA (transit only)", data: "API requests only — no data stored" },
                  { name: "Vercel",         role: "Frontend hosting",        region: "Global CDN",        data: "Static files only — no personal data" },
                  { name: "Resend",         role: "Transactional email",     region: "USA",               data: "Email address and message content" },
                ].map((s) => (
                  <div key={s.name} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs">
                    <div><span className="text-stone-400 block mb-0.5">Service</span><span className="font-semibold text-stone-800">{s.name}</span></div>
                    <div><span className="text-stone-400 block mb-0.5">Role</span><span className="text-stone-700">{s.role}</span></div>
                    <div><span className="text-stone-400 block mb-0.5">Region</span><span className="text-stone-700">{s.region}</span></div>
                    <div><span className="text-stone-400 block mb-0.5">Data shared</span><span className="text-stone-700">{s.data}</span></div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-stone-500 mt-2">
                We do not use advertising networks, social media pixels, or analytics platforms (e.g. Google Analytics, Meta Pixel).
              </p>
            </Section>

            {/* 9 */}
            <Section id="s9" number="9" title="Changes to This Policy">
              <p>
                We may update this policy as the platform evolves. When we make material changes, we will:
              </p>
              <CheckList items={[
                "Update the effective date at the top of this page",
                "Notify registered users by email at least 14 days before changes take effect",
                "Keep a version history available on request",
              ]} />
              <p className="text-sm">
                Continued use of {BRAND.name} after the effective date constitutes acceptance of the updated policy.
              </p>
            </Section>

            {/* 10 */}
            <Section id="s10" number="10" title="Contact & Complaints">
              <p>
                For any privacy-related questions, data requests, or complaints, contact us at:
              </p>
              <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl mt-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">Privacy enquiries</p>
                  <a
                    href={`mailto:${BRAND.supportEmail}`}
                    className="text-sm text-indigo-600 hover:underline font-medium"
                  >
                    {BRAND.supportEmail}
                  </a>
                  <p className="text-xs text-stone-500 mt-0.5">We aim to respond within 2 business days.</p>
                </div>
              </div>
              <p className="text-sm mt-3">
                If you are not satisfied with our response, you may contact the{" "}
                <a
                  href="https://www.oaic.gov.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  Office of the Australian Information Commissioner (OAIC)
                </a>{" "}
                to lodge a complaint.
              </p>
            </Section>

            {/* Footer note */}
            <div className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                <p className="text-xs text-stone-500 leading-relaxed">
                  This policy applies to the {BRAND.name} platform operated by {BRAND.partnersLine} as part of the La Trobe University Capstone 2026 program. A formally reviewed policy will be issued before any public commercial release.
                </p>
                <Link
                  to="/contact"
                  className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline whitespace-nowrap"
                >
                  Contact us →
                </Link>
              </div>
            </div>

          </article>
        </div>
      </div>
    </div>
  );
}

export default Privacy;