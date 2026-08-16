import { Check } from "lucide-react";

import { LandingCta } from "./LandingCta";

/**
 * Pricing per phase 1–2: recruiting is free for recruiters (the subscription
 * is suspended, so no price is fetched or shown), and companies simply set
 * their own success fee per job.
 */
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-background">
      <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-10">
        <h2 className="mb-3 text-center font-heading text-3xl font-extrabold text-navy md:text-4xl">
          Simple, Honest Pricing
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-brand-gray">
          No subscriptions, no retainers. The only fee is the one the company
          sets for a successful hire.
        </p>
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-brand-line bg-white p-8 shadow-card">
            <h3 className="font-heading text-xl font-extrabold text-navy">
              For Companies
            </h3>
            <p className="mt-1 font-heading text-4xl font-extrabold text-primary">
              You set the price
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-[15px] text-brand-slate">
              {[
                "Post jobs free — pay only for a successful hire",
                "Name the exact fee a placement is worth to you",
                "Candidates from industry-experienced recruiters",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {line}
                </li>
              ))}
            </ul>
            <LandingCta
              role="company"
              authedHref="/company/jobs/new"
              className="mt-8 h-auto rounded-[10px] px-5 py-3.5 font-bold"
            >
              Post a Job &amp; Set Your Price
            </LandingCta>
          </article>

          <article className="flex flex-col rounded-2xl border border-brand-line bg-white p-8 shadow-card">
            <h3 className="font-heading text-xl font-extrabold text-navy">
              For Recruiters
            </h3>
            <p className="mt-1 font-heading text-4xl font-extrabold text-primary">
              Free
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-[15px] text-brand-slate">
              {[
                "Browse live roles across all 50 states",
                "Choose the searches that match your experience",
                "Earn the full fee the company offers",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {line}
                </li>
              ))}
            </ul>
            <LandingCta
              role="recruiter"
              authedHref="/explore-jobs"
              className="mt-8 h-auto rounded-[10px] px-5 py-3.5 font-bold"
            >
              Start Recruiting Free
            </LandingCta>
          </article>
        </div>
      </div>
    </section>
  );
}
