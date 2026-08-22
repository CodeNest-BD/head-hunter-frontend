"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { DecorativeUsMap } from "./DecorativeUsMap";
import { LandingCta } from "./LandingCta";
import { StatsStrip } from "./StatsStrip";

/**
 * Light hero per the client reference: dark-blue display headline with a
 * primary-blue accent, the client's body copy, two CTAs, and the illustrative
 * USA map on the right. (The "For companies / For recruiters" mini-cards from
 * the old mock are explicitly removed in the client feedback.)
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-16 pt-14 md:px-10 md:pb-20 lg:grid-cols-[1fr_1.05fr]">
        <div className="[animation:fadeUp_500ms_ease_both]">
          <h1 className="mb-6 font-heading text-hero text-navy">
            You Set the Price. We Connect You to the{" "}
            <span className="text-primary">Best.</span>
          </h1>
          <p className="mb-9 max-w-xl text-lg leading-relaxed text-brand-slate">
            Companies name their price for recruiting services. Recruiters find
            open jobs and get paid what you&rsquo;re willing to offer.
          </p>
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <LandingCta
              role="company"
              authedHref="/company/jobs/new"
              className="h-auto rounded-[10px] px-6 py-4 text-base font-bold"
            >
              Post a Job &amp; Set Your Price
              <ArrowRight className="ml-1 h-4 w-4" />
            </LandingCta>
            <Button
              asChild
              variant="outline"
              className="h-auto rounded-[10px] border-brand-primary px-6 py-4 text-base font-bold text-primary hover:bg-accent hover:text-primary"
            >
              <Link href="/explore-jobs">
                Explore Open Jobs
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-6 [animation:fadeUp_600ms_120ms_ease_both]">
          <DecorativeUsMap />
          {/* Live marketplace stats sit directly under the map (per the
              client reference), scoped to the map column. */}
          <StatsStrip />
        </div>
      </div>
    </section>
  );
}
