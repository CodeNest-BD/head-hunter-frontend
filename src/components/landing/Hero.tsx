"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useAuth } from "@/features/auth";
import { Button } from "@/shared/ui-components/controls/button";
import { LandingCta } from "./LandingCta";
import { StatsStrip } from "./StatsStrip";

/**
 * Light hero per the client reference: dark-blue display headline with a
 * primary-blue accent, the client's body copy, two CTAs, and the marketplace
 * map image on the right. (The "For companies / For recruiters" mini-cards from
 * the old mock are explicitly removed in the client feedback.)
 */
export function Hero() {
  const { status, user } = useAuth();
  // The live job map is a recruiter surface. A signed-in employer clicking
  // "Explore Open Jobs" would land on a map that isn't for them, so the CTA is
  // disabled for them (guests and recruiters still follow it).
  const isEmployer = status === "authenticated" && user?.role === "company";

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-[1240px] items-stretch gap-12 px-4 pb-16 pt-10 sm:px-5 md:px-10 md:pb-20 lg:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col [animation:fadeUp_500ms_ease_both]">
          {/* Text block centers vertically in the space above the CTAs so it
              sits opposite the map, instead of clinging to the top edge. */}
          <div className="my-auto">
            <h1 className="mb-6 font-heading text-3xl font-extrabold leading-[1.15] tracking-tight text-navy sm:text-5xl">
              Set Your Price.{" "}
              {/* Its own line, per the client reference — the accent half is a
                  second statement, not a continuation of the first. */}
              <span className="block text-primary">Hire the Right Talent.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-brand-slate">
              Companies name their own price for professional recruiting
              services. Industry-experienced recruiters find open jobs, send
              great candidates, and get paid to work on their own terms.
            </p>
          </div>
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <LandingCta
              role="company"
              authedHref="/company/jobs/new"
              className="h-auto rounded-[10px] px-6 py-4 text-base font-bold"
            >
              Post a Job &amp; Set Your Price
              <ArrowRight className="ml-1 h-4 w-4" />
            </LandingCta>
            {isEmployer ? (
              <Button
                variant="outline"
                disabled
                title="The live job map is for recruiters."
                className="h-auto w-full cursor-not-allowed rounded-[10px] border-brand-primary px-6 py-4 text-base font-bold text-primary sm:w-auto"
              >
                Explore Open Jobs
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                className="h-auto w-full rounded-[10px] border-brand-primary px-6 py-4 text-base font-bold text-primary hover:bg-accent hover:text-primary sm:w-auto"
              >
                <Link href="/explore-jobs">
                  Explore Open Jobs
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 [animation:fadeUp_600ms_120ms_ease_both]">
          <Image
            src="/assets/brand/hero.png"
            alt="Open roles and recruiter fees on a world map"
            width={1774}
            height={887}
            priority
            // Roughly half the viewport from lg (two-column hero), full width
            // below — so the optimizer serves a right-sized variant, not the
            // full 1774px source, on smaller screens.
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-auto w-full"
          />
          {/* Live marketplace stats sit directly under the map (per the
              client reference), scoped to the map column. */}
          <StatsStrip />
        </div>
      </div>
    </section>
  );
}
