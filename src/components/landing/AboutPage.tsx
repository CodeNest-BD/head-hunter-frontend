import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  Coins,
  Search,
  Sparkles,
  UserSearch,
  X,
  type LucideIcon,
} from "lucide-react";

import { Pill } from "@/shared/ui-components/badges/Pill";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { Tile } from "@/shared/ui-components/list/Tile";
import { LandingCta } from "./LandingCta";
import { PublicShell } from "./PublicShell";

/** The reference's `.pubwrap` — the public pages' single content measure. */
const PUBWRAP = "mx-auto max-w-[1200px] px-6";

/** One of the two legacy hiring options, shown as a trade-off card. */
function OptionCard({
  index,
  icon,
  title,
  upside,
  downside,
}: {
  index: string;
  icon: LucideIcon;
  title: string;
  upside: string;
  downside: string;
}) {
  return (
    <Card>
      <CardContent>
        <Tile icon={icon} tone="blue" />
        <p className="mt-3 text-label font-[650] uppercase text-ink-muted">
          Option {index}
        </p>
        <h3 className="mt-1 text-card font-[650] text-ink">{title}</h3>
        <p className="mt-3.5 flex gap-2 text-body text-ink-body">
          <Check
            className="mt-[2px] size-[15px] shrink-0 text-ok"
            strokeWidth={2.5}
          />
          <span>{upside}</span>
        </p>
        <p className="mt-2.5 flex gap-2 text-body text-ink-body">
          <X
            className="mt-[2px] size-[15px] shrink-0 text-bad"
            strokeWidth={2.5}
          />
          <span>{downside}</span>
        </p>
      </CardContent>
    </Card>
  );
}

/** The value proposition for one side of the marketplace. */
function AudienceCard({
  icon,
  eyebrow,
  title,
  points,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  points: readonly string[];
}) {
  return (
    <Card>
      <CardContent>
        <Tile icon={icon} tone="blue" />
        <p className="mt-3 text-label font-[650] uppercase text-ink-muted">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-card font-[650] text-ink">{title}</h3>
        <ul className="mt-3 flex flex-col gap-2.5">
          {points.map((point) => (
            <li key={point} className="flex gap-2 text-body text-ink-body">
              <Check
                className="mt-[2px] size-[15px] shrink-0 text-ok"
                strokeWidth={2.5}
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * The public About page: the story of why Head-Hunters exists, framed as the
 * "third option" between job boards and traditional agencies, with the value to
 * each side of the marketplace and a closing call to action.
 *
 * The reference tells it in five `.band`s — problem, pivot, payoff, close —
 * alternating white and tinted so each beat separates itself without a rule,
 * with the navy band isolating the one brand moment.
 */
export function AboutPage() {
  return (
    <PublicShell>
      {/* Hero — `.band--tint` */}
      <section className="bg-gradient-to-b from-surface to-canvas py-14">
        <div className={PUBWRAP}>
          <p className="text-[11.5px] font-[750] uppercase tracking-[0.14em] text-blue">
            About Head-Hunters
          </p>
          <h1 className="mt-2.5 max-w-[720px] text-[clamp(30px,4.5vw,44px)] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy">
            A better way to hire—and a better way to recruit.
          </h1>
          <p className="mt-3.5 max-w-[620px] text-[15.5px] leading-[1.6] text-ink-body">
            We connect companies seeking professionally sourced talent at a
            price that makes sense with experienced, independent recruiters who
            want the freedom to recruit without the overhead, restrictions, and
            constant business development required at traditional agencies.
          </p>
          {/* Both are sign-up CTAs, so a signed-in visitor is deep-linked
              instead and the side that isn't theirs is disabled — following it
              only bounced them off /signup into their own dashboard. */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <LandingCta
              role="company"
              authedHref="/company/jobs/new"
              guestHref="/signup?role=company"
              disabledTitle="Posting a job is for employers."
              size="lg"
            >
              I&rsquo;m hiring
              <ArrowRight />
            </LandingCta>
            <LandingCta
              role="recruiter"
              authedHref="/dashboard"
              guestHref="/signup?role=recruiter"
              disabledTitle="You&rsquo;re signed in as an employer."
              variant="outline"
              size="lg"
            >
              I&rsquo;m a recruiter
            </LandingCta>
          </div>
        </div>
      </section>

      {/* The two legacy options — a white band */}
      <section className="bg-surface py-14">
        <div className={PUBWRAP}>
          <h2 className="text-[22px] font-bold text-navy">
            For decades, hiring meant choosing between two options
          </h2>
          <p className="mt-1.5 max-w-[560px] text-sub text-ink-muted">
            Companies looking to fill critical positions have essentially had
            two paths—and both come with significant trade-offs.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <OptionCard
              index="1"
              icon={Search}
              title="Post the position on a job board"
              upside="Quick to post and puts the role in front of active applicants."
              downside="Reaches only candidates who happen to be searching while the role is posted—leaving qualified passive candidates completely outside the search."
            />
            <OptionCard
              index="2"
              icon={Building2}
              title="Hire a traditional recruiting agency"
              upside="Actively sources and engages candidates who may never apply to a posting."
              downside="That reach comes at a steep cost—agency fees of 20%–30% of annual salary, often $10,000, $20,000 or more for a single hire."
            />
          </div>
        </div>
      </section>

      {/* The third option — `.band--navy`, the page's one brand moment */}
      <section className="bg-navy py-14 text-rail-ink">
        <div className="mx-auto max-w-[760px] px-6 text-center">
          <Pill
            plain
            tone="neutral"
            className="h-6.5 bg-white/10 px-3 text-white"
          >
            <Sparkles className="size-[13px]" />
            The third option
          </Pill>
          <h2 className="mt-4 text-[28px] font-[750] leading-tight tracking-[-0.02em] text-white">
            Head-Hunters.com creates a third option.
          </h2>
          <p className="mt-3.5 text-[15px] leading-[1.65] text-rail-ink">
            Companies set the recruiting fee they&rsquo;re willing to pay and
            gain access to experienced recruiters who actively source candidates
            for their openings. By removing much of the overhead of the
            traditional agency model, Head-Hunters.com gives companies a more
            flexible, competitive way to access professionally recruited
            talent—on a budget they control.
          </p>
        </div>
      </section>

      {/* Value to each side — a white band */}
      <section className="bg-surface py-14">
        <div className={PUBWRAP}>
          <div className="grid gap-4 md:grid-cols-2">
            <AudienceCard
              icon={Coins}
              eyebrow="For companies"
              title="Professionally recruited talent, on your budget"
              points={[
                "Set the recruiting fee you're willing to pay for each role.",
                "Access experienced recruiters who actively source candidates—not just those already applying.",
                "Get the reach of an agency without traditional agency costs.",
              ]}
            />
            <AudienceCard
              icon={UserSearch}
              eyebrow="For recruiters"
              title="Real opportunities, without the sales grind"
              points={[
                "Browse live, fee-backed jobs from companies already looking for recruiting help.",
                "No cold calling. No sales quotas. No endless business development.",
                "Work the industries and specialties you know best, and earn placement fees on successful hires.",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Closing — `.band--tint` again, symmetric with the hero */}
      <section className="bg-gradient-to-b from-surface to-canvas py-14">
        <div className="mx-auto max-w-[760px] px-6 text-center">
          <Tile icon={ClipboardList} tone="blue" />
          <h2 className="mt-4 text-page font-bold text-navy">
            Companies set the opportunity. Recruiters bring the talent. We bring
            them together.
          </h2>
          <p className="mt-2.5 text-sub text-ink-muted">
            Posting, sourcing, scheduling, and hiring—all in one place. Welcome
            to Head-Hunters.com, the open marketplace for professional
            recruiting.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Button asChild size="lg">
              <Link href="/signup">
                Get started
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/explore-jobs">Explore open jobs</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
