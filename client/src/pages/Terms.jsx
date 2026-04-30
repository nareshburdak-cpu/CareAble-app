import BRAND from "../constants/brand";

function Terms() {
  const lastUpdated = "April 2026";

  return (
    <section className="flex-1 bg-stone-50 py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-medium mb-2">
            Terms of Service
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-2">
            Fair use, plainly stated.
          </h1>
          <p className="text-sm text-stone-500">Last updated: {lastUpdated}</p>
        </div>

        <article className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-10 space-y-6 text-stone-700 leading-relaxed">
          <Section title="1. Eligibility">
            <p>
              {BRAND.name} is intended for adults (18+) self-identifying as informal caregivers. By using the platform, you confirm you meet this requirement.
            </p>
          </Section>

          <Section title="2. Honest Self-Assessment">
            <p>
              The assessment relies on honest self-reflection. Misrepresentation undermines the validity of your results and any certificate generated.
            </p>
          </Section>

          <Section title="3. Your Account">
            <p>
              You're responsible for keeping your login secure. Notify us immediately if you suspect unauthorised access.
            </p>
          </Section>

          <Section title="4. Certificates">
            <p>
              Certificates are issued as a recognition tool. They reflect self-reported capability and are not a substitute for formal qualifications, professional registration, or industry licensure.
            </p>
          </Section>

          <Section title="5. Acceptable Use">
            <p>Don't use {BRAND.name} to:</p>
            <ul className="list-disc list-outside ml-6 mt-2 space-y-1">
              <li>Create multiple accounts to manipulate results</li>
              <li>Reverse-engineer the platform</li>
              <li>Scrape or republish content without permission</li>
              <li>Misrepresent your certificate to deceive others</li>
            </ul>
          </Section>

          <Section title="6. Research Participation">
            <p>
              By using {BRAND.name}, you may contribute anonymised, aggregated data to ongoing research at {BRAND.partnersLine}. You can opt out of research participation at any time by deleting your account.
            </p>
          </Section>

          <Section title="7. Service Availability">
            <p>
              {BRAND.name} is provided "as is" during this research and development phase. We aim for high availability but cannot guarantee uninterrupted service.
            </p>
          </Section>

          <Section title="8. Changes">
            <p>
              These terms may change as the project evolves. Material changes will be communicated via email or in-app notice.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Questions? Reach us at{" "}
              <a href={`mailto:${BRAND.supportEmail}`} className="text-emerald-700 underline hover:text-emerald-800">
                {BRAND.supportEmail}
              </a>.
            </p>
          </Section>

          <p className="text-xs text-stone-500 pt-4 border-t border-stone-100">
            Placeholder terms for an early-stage student research project under {BRAND.partnersLine}. Formal terms will be issued before public release.
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

export default Terms;