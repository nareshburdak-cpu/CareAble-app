import BRAND from "../constants/brand";

function Contact() {
  return (
    <section className="flex-1 bg-gradient-to-b from-stone-50 via-white to-stone-50 py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-medium mb-3">
            Get in touch
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight">
            We'd love to<br />
            <span className="italic text-emerald-700">hear from you.</span>
          </h1>
          <p className="text-stone-600 leading-relaxed max-w-xl mx-auto">
            Questions, feedback, partnership ideas, or just want to share your story — we read every email.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 md:p-10 space-y-6">
          <ContactItem
            iconPath="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            label="Email us"
            value={BRAND.supportEmail}
            href={`mailto:${BRAND.supportEmail}`}
          />

          <ContactItem
            iconPath="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            label="Partnerships & research"
            value={`${BRAND.university} × ${BRAND.centre}`}
          />

          <ContactItem
            iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            label="Response time"
            value="Usually within 2–3 business days"
          />
        </div>

        <p className="mt-8 text-sm text-stone-500 text-center max-w-md mx-auto">
          This is an active research project — we love hearing from carers, researchers, employers, and educators. Every message helps us improve.
        </p>
      </div>
    </section>
  );
}

function ContactItem({ iconPath, label, value, href }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-1">
          {label}
        </p>
        {href ? (
          <a href={href} className="text-emerald-700 hover:text-emerald-800 underline-offset-4 hover:underline font-medium">
            {value}
          </a>
        ) : (
          <span className="text-stone-900 font-medium">{value}</span>
        )}
      </div>
    </div>
  );
}

export default Contact;