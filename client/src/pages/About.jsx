/**
 * About — Mission & team page
 */

import { Link } from "react-router-dom";
import BRAND from "../constants/brand";

function About() {
  return (
    <section className="flex-1 bg-gradient-to-b from-stone-50 via-white to-stone-50 py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 font-medium mb-3">
            About {BRAND.name}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 leading-tight">
            Recognising the work<br />
            <span className="italic text-emerald-700">that often goes unseen.</span>
          </h1>
        </div>

        <div className="prose prose-stone max-w-none space-y-6 text-stone-700 leading-relaxed">
          <p className="text-lg">
            CareAble is built for unpaid carers — the family members, friends, and neighbours
            who provide everyday support to someone they love. They rarely call themselves
            "carers" and almost never see their work as professional skill.
          </p>

          <p>
            That has real consequences. Hidden carers miss out on support services. They
            struggle to articulate their value in job interviews. They burn out without ever
            recognising why.
          </p>

          <h2 className="font-serif text-2xl font-bold text-stone-900 pt-8">Our Mission</h2>
          <p>
            We help hidden carers <strong>recognise, validate, and showcase</strong> the
            extraordinary skills they've built through care. Through a self-paced
            assessment aligned with the Australian Skills Classification, we turn lived
            experience into recognised capability.
          </p>

          <h2 className="font-serif text-2xl font-bold text-stone-900 pt-8">Built In Partnership</h2>
          <p>
            CareAble is a research and development project in partnership with{" "}
            <strong>{BRAND.university}</strong> and <strong>{BRAND.centre}</strong>{" "}
            (Australian Centre for Ageing, Migration & Inclusion). The platform draws on
            evidence from co-design workshops with real carers and is designed to support
            both individual self-recognition and broader research into informal caregiving.
          </p>

          <h2 className="font-serif text-2xl font-bold text-stone-900 pt-8">What's Next</h2>
          <p>
            We're actively iterating with carers, employers, and academic partners. Future
            updates will include localisation, deeper skills mapping, and verification
            tools for employers and education providers.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-14 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="px-6 py-3 bg-emerald-700 text-white font-medium rounded-full hover:bg-emerald-800 transition shadow-md"
          >
            Discover your skills →
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 border-2 border-stone-200 text-stone-700 font-medium rounded-full hover:border-emerald-300 hover:text-emerald-700 transition"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </section>
  );
}

export default About;