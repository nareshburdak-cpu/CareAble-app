import BRAND from "../constants/brand";

function Privacy() {
  const lastUpdated = "April 2026";

  return (
    <section className="flex-1 bg-stone-50 py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-medium mb-2">
            Privacy Policy
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-2">
            Your data, your trust.
          </h1>
          <p className="text-sm text-stone-500">Last updated: {lastUpdated}</p>
        </div>

        <article className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-10 space-y-6 text-stone-700 leading-relaxed">
          <Section title="1. Information We Collect">
            <p>When you use {BRAND.name}, we collect:</p>
            <ul className="list-disc list-outside ml-6 mt-2 space-y-1">
              <li>Account information (name, email)</li>
              <li>Self-assessment answers and results</li>
              <li>Anonymous usage data (page views, errors)</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Data">
            <p>
              Your data is used to provide your personalised assessment, generate your certificate, and improve the platform. Anonymised, aggregated data may be used for academic research with our partners at {BRAND.university} and {BRAND.centre}.
            </p>
          </Section>

          <Section title="3. What We Don't Do">
            <ul className="list-disc list-outside ml-6 space-y-1">
              <li>We never sell your personal data to third parties.</li>
              <li>We don't share identifiable information with employers.</li>
              <li>We don't use your data for advertising.</li>
            </ul>
          </Section>

          <Section title="4. Data Security">
            <p>
              Passwords are hashed with industry-standard algorithms. Sessions use signed JSON Web Tokens. All data is stored on encrypted, region-bound databases (Sydney, Australia).
            </p>
          </Section>

          <Section title="5. Your Rights">
            <p>
              You can view, edit, or delete your account at any time from your <strong>Profile</strong> page. Account deletion permanently removes all your data within 30 days.
            </p>
          </Section>

          <Section title="6. Cookies & Local Storage">
            <p>
              We use minimal local storage to keep you logged in. We do not use marketing, analytics, or third-party tracking cookies.
            </p>
          </Section>

          <Section title="7. Contact">
            <p>
              For privacy-related questions, please contact us at{" "}
              <a href={`mailto:${BRAND.supportEmail}`} className="text-emerald-700 underline hover:text-emerald-800">
                {BRAND.supportEmail}
              </a>.
            </p>
          </Section>

          <p className="text-xs text-stone-500 pt-4 border-t border-stone-100">
            This is a placeholder privacy policy for an early-stage student research project under {BRAND.partnersLine}. A formal policy will be issued before public release.
          </p>
        </article>
      </div>
    </section>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-stone-900 mb-2">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

export default Privacy;