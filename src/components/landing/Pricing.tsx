import { LandingCta } from "./LandingCta";

/**
 * Pricing section copied from the v2 mock: "Simple, honest pricing." with a
 * white "free forever" company card and a navy "$199 / month" recruiter card.
 */
export function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 bg-background px-5 py-20 md:px-10 md:py-24"
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-11 text-center font-heading text-[34px] font-extrabold tracking-[-0.02em] text-navy sm:text-[42px]">
          Simple, honest pricing.
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-9 shadow-card">
            <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.09em] text-muted-foreground">
              Companies
            </div>
            <div className="font-heading text-[44px] font-extrabold text-navy">
              Free
              <span className="text-[17px] font-semibold text-[#8A93A3]">
                {" "}
                forever
              </span>
            </div>
            <p className="my-4 text-[15px] leading-relaxed text-[#3A4351]">
              Post unlimited jobs at no cost. You choose the recruiter fee for
              each role — that&apos;s the only money you ever spend.
            </p>
            <LandingCta
              role="company"
              authedHref="/company/jobs/new"
              className="h-auto w-full rounded-[10px] bg-navy py-3.5 text-[15px] font-bold text-white hover:bg-navy/90"
            >
              Create a company account
            </LandingCta>
          </article>

          <article className="rounded-2xl bg-navy p-9 text-white shadow-card-lg">
            <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.09em] text-[#8FB0F5]">
              Recruiters
            </div>
            <div className="font-heading text-[44px] font-extrabold">
              $199
              <span className="text-[17px] font-semibold text-[#7D89A3]">
                {" "}
                / month
              </span>
            </div>
            <p className="my-4 text-[15px] leading-relaxed text-[#B6C1D6]">
              Full access to the job map, unlimited candidate submissions, and
              guaranteed escrow-backed payouts. Cancel anytime.
            </p>
            <LandingCta
              role="recruiter"
              authedHref="/recruiter/subscription"
              className="h-auto w-full rounded-[10px] py-3.5 text-[15px] font-bold"
            >
              Start recruiting
            </LandingCta>
          </article>
        </div>
      </div>
    </section>
  );
}
