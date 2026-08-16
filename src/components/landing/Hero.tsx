"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { DecorativeUsMap } from "./DecorativeUsMap";
import { LandingCta } from "./LandingCta";

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
            Set Your Own Price.{" "}
            <span className="text-primary">Hire the Right Talent.</span>
          </h1>
          <p className="mb-3 max-w-xl text-lg leading-relaxed text-brand-slate">
            Companies name their own price for professional recruiting services.
          </p>
          <p className="mb-9 max-w-xl text-lg leading-relaxed text-brand-slate">
            Industry-experienced recruiters find open jobs, send great
            candidates, and get paid to work on their own terms.
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

        <div className="[animation:fadeUp_600ms_120ms_ease_both]">
          <DecorativeUsMap />
        </div>
      </div>
    </section>
  );
}
