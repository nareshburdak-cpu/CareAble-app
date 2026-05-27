/**
 * Contact — Get in touch page
 * ----------------------------
 * Colors: indigo-600/700 primary, purple accents, stone neutrals (matches Home.jsx)
 * Form:   same logic as Home.jsx Contact section — POST /api/contact via raw fetch
 */

import { useState } from "react";
import BRAND from "../constants/brand";

/* ─── form field ─────────────────────────────────────────── */
function FormField({ label, name, type = "text", value, onChange, error, placeholder }) {
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

/* ─── contact info card ──────────────────────────────────── */
function InfoCard({ iconPath, label, value, href, sub }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-stone-200 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-0.5">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-medium text-indigo-600 hover:underline underline-offset-4">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-stone-900">{value}</p>
        )}
        {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── audience tag ───────────────────────────────────────── */
function AudienceTag({ emoji, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-full text-xs font-medium text-stone-700">
      {emoji} {label}
    </span>
  );
}

/* ─── main component ─────────────────────────────────────── */
function Contact() {
  const [form,   setForm]   = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errors, setErrors] = useState({});

  /* validation */
  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.email.trim())   e.email   = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                              e.email   = "Enter a valid email address";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name])   setErrors((prev) => ({ ...prev, [name]: "" }));
    if (errors.submit)  setErrors((prev) => ({ ...prev, submit: "" }));
  };

  /* submit — same API call as Home.jsx Contact section */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res  = await fetch(`${apiBase}/contact`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("idle");
      setErrors((prev) => ({ ...prev, submit: err.message || "Failed to send. Please try again." }));
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-stone-50 via-white to-stone-50">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-stone-100 py-14 md:py-20">
        {/* Blobs — same as Home hero */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)" }}
        />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          {/* Eyebrow pill — same as Home */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-medium text-indigo-800 uppercase tracking-wide">
              Get in touch
            </span>
          </div>

          {/* Headline + SVG underline — same pattern as Home h1 */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-[1.05] mb-5 tracking-tight">
            We'd love to{" "}
            <span className="italic text-indigo-700 relative inline-block">
              hear from you.
              <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 300 12" preserveAspectRatio="none">
                <path d="M2 8 Q 75 2, 150 7 T 298 6" stroke="#A855F7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-lg text-stone-600 leading-relaxed mb-8 max-w-xl mx-auto">
            Questions, feedback, partnership ideas, or just want to share your story — we read every message.
          </p>

          {/* Audience tags */}
          <div className="flex flex-wrap justify-center gap-2">
            <AudienceTag emoji="🫶" label="Carers" />
            <AudienceTag emoji="🏢" label="Employers" />
            <AudienceTag emoji="🔬" label="Researchers" />
            <AudienceTag emoji="🎓" label="Educators" />
            <AudienceTag emoji="🤝" label="Partners" />
          </div>
        </div>
      </section>

      {/* ── BODY ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-14 md:py-20">
        <div className="grid md:grid-cols-5 gap-10 md:gap-14 items-start">

          {/* ── LEFT — info ─────────────────────────────────────── */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-700 font-medium mb-2">
                Contact details
              </p>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-1 leading-tight">
                Reach us directly
              </h2>
              <p className="text-base text-stone-500 leading-relaxed">
                This is an active research project. Every message helps us improve CareAble for carers across Australia.
              </p>
            </div>

            <InfoCard
              iconPath="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              label="Email"
              value={BRAND.supportEmail}
              href={`mailto:${BRAND.supportEmail}`}
              sub="We aim to reply within 2–3 business days"
            />

            <InfoCard
              iconPath="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              label="Partnerships & research"
              value={`${BRAND.university} × ${BRAND.centre}`}
              sub="For academic and institutional inquiries"
            />

            <InfoCard
              iconPath="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              label="Location"
              value="La Trobe University, Melbourne VIC"
              sub="Capstone 2026 · Team NEXA"
            />

            {/* Divider */}
            <div className="pt-2 border-t border-stone-200" />

            {/* Response time note */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <svg className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-indigo-800 mb-0.5">Response time</p>
                <p className="text-sm text-indigo-700 leading-snug">
                  Usually within 2–3 business days. For urgent matters, email us directly at{" "}
                  <a href={`mailto:${BRAND.supportEmail}`} className="underline hover:text-indigo-900">
                    {BRAND.supportEmail}
                  </a>.
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT — form ─────────────────────────────────────── */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 md:p-8">

              {status === "sent" ? (
                /* ── SUCCESS STATE ──────────────────────────────── */
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">Message sent!</h3>
                  <p className="text-stone-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                    Thank you for reaching out. We'll get back to you within 2–3 business days.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="text-sm font-medium text-indigo-600 hover:underline underline-offset-4"
                  >
                    Send another message →
                  </button>
                </div>
              ) : (
                /* ── FORM ───────────────────────────────────────── */
                <>
                  <div className="mb-6">
                    <h2 className="font-serif text-xl font-bold text-stone-900 mb-1">Send us a message</h2>
                    <p className="text-base text-stone-500">All fields marked with * are required.</p>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="space-y-4">

                    {/* Name + Email row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        label="Your name *"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="Jane Smith"
                      />
                      <FormField
                        label="Email address *"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder="you@example.com"
                      />
                    </div>

                    {/* Subject — optional, nice UX */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">
                        Subject{" "}
                        <span className="text-stone-400 font-normal">(optional)</span>
                      </label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-stone-300 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-stone-700"
                      >
                        <option value="">Select a topic…</option>
                        <option value="General enquiry">General enquiry</option>
                        <option value="Partnership / research">Partnership / research</option>
                        <option value="Carer feedback">Carer feedback</option>
                        <option value="Employer enquiry">Employer enquiry</option>
                        <option value="Technical issue">Technical issue</option>
                        <option value="Media enquiry">Media enquiry</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Tell us how we can help, or share your story…"
                        className={`block w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none ${
                          errors.message ? "border-red-300 bg-red-50" : "border-stone-300 bg-white"
                        }`}
                      />
                      {errors.message && (
                        <p className="text-xs text-red-600 mt-1">{errors.message}</p>
                      )}
                    </div>

                    {/* Submit error */}
                    {errors.submit && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        {errors.submit}
                      </p>
                    )}

                    {/* Submit button — same style as Home */}
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="w-full px-6 py-3.5 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-500/20 inline-flex items-center justify-center gap-2"
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
                        <>
                          Send message
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </button>

                    <p className="text-sm text-stone-400 text-center leading-relaxed">
                      By sending a message you agree to our{" "}
                      <a href="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</a>.
                      We never share your details with third parties.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ── BOTTOM BAND — same gradient as Home FinalCTA ──────── */}
      <section className="relative overflow-hidden py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 pointer-events-none" />
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.4), transparent 70%)" }}
        />
        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-200 font-medium mb-3">
            Not ready to message us yet?
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4 leading-tight">
            Start your free assessment —
            <span className="italic text-indigo-200"> it only takes 10–15 minutes.</span>
          </h2>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white hover:bg-indigo-50 text-indigo-700 font-medium rounded-full transition shadow-2xl text-sm"
          >
            Get started free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </section>

    </div>
  );
}

export default Contact;
