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
} from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { PublicShell } from "./PublicShell";

/** One of the two legacy hiring options, shown as a trade-off card. */
function OptionCard({
  index,
  icon: Icon,
  title,
  upside,
  downside,
}: {
  index: string;
  icon: typeof Search;
  title: string;
  upside: string;
  downside: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-brand-line bg-white p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-brand-gray-light">
          Option {index}
        </p>
      </div>
      <h3 className="mt-4 font-heading text-lg font-bold text-navy">{title}</h3>
      <p className="mt-3 flex gap-2 text-[15px] leading-relaxed text-brand-slate">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>{upside}</span>
      </p>
      <p className="mt-2 flex gap-2 text-[15px] leading-relaxed text-brand-slate">
        <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <span>{downside}</span>
      </p>
    </div>
  );
}

/** The value proposition for one side of the marketplace. */
function AudienceCard({
  icon: Icon,
  eyebrow,
  title,
  points,
}: {
  icon: typeof Search;
  eyebrow: string;
  title: string;
  points: readonly string[];
}) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-7 shadow-card">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.14em] text-primary">
        {eyebrow}
      </p>
      <h3 className="mt-1 font-heading text-xl font-bold text-navy">{title}</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {points.map((point) => (
          <li
            key={point}
            className="flex gap-2.5 text-[15px] leading-relaxed text-brand-slate"
          >
            <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The public About page: the story of why Head-Hunters exists, framed as the
 * "third option" between job boards and traditional agencies, with the value to
 * each side of the marketplace and a closing call to action.
 */
export function AboutPage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="border-b border-brand-line bg-gradient-to-b from-secondary to-background">
        <div className="mx-auto max-w-[1100px] px-5 py-16 md:px-10 md:py-24">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary">
            About Head-Hunters
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-extrabold leading-[1.08] tracking-[-0.02em] text-navy md:text-6xl">
            A better way to hire—and a better way to recruit.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-slate">
            We connect companies seeking professionally sourced talent at a
            price that makes sense with experienced, independent recruiters who
            want the freedom to recruit without the overhead, restrictions, and
            constant business development required at traditional agencies.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="font-bold">
              <Link href="/signup?role=company">
                I&rsquo;m hiring
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="font-semibold"
            >
              <Link href="/signup?role=recruiter">I&rsquo;m a recruiter</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* The two legacy options */}
      <section className="mx-auto max-w-[1100px] px-5 py-16 md:px-10 md:py-20">
        <div className="max-w-2xl">
          <h2 className="font-heading text-2xl font-bold text-navy md:text-3xl">
            For decades, hiring meant choosing between two options
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-brand-slate">
            Companies looking to fill critical positions have essentially had
            two paths—and both come with significant trade-offs.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
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
      </section>

      {/* The third option */}
      <section className="bg-navy">
        <div className="mx-auto max-w-[1100px] px-5 py-16 md:px-10 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/80">
            <Sparkles className="h-3.5 w-3.5" />
            The third option
          </span>
          <h2 className="mt-5 max-w-3xl font-heading text-3xl font-extrabold leading-tight tracking-[-0.02em] text-white md:text-4xl">
            Head-Hunters.com creates a third option.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/80">
            Companies set the recruiting fee they&rsquo;re willing to pay and
            gain access to experienced recruiters who actively source candidates
            for their openings. By removing much of the overhead of the
            traditional agency model, Head-Hunters.com gives companies a more
            flexible, competitive way to access professionally recruited
            talent—on a budget they control.
          </p>
        </div>
      </section>

      {/* Value to each side */}
      <section className="mx-auto max-w-[1100px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid gap-5 md:grid-cols-2">
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
      </section>

      {/* Closing */}
      <section className="border-t border-brand-line bg-secondary/50">
        <div className="mx-auto max-w-[1100px] px-5 py-16 text-center md:px-10 md:py-20">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="h-6 w-6" />
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl font-heading text-2xl font-extrabold tracking-[-0.02em] text-navy md:text-3xl">
            Companies set the opportunity. Recruiters bring the talent. We bring
            them together.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-brand-slate">
            Posting, sourcing, scheduling, and hiring—all in one place. Welcome
            to Head-Hunters.com, the open marketplace for professional
            recruiting.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="font-bold">
              <Link href="/signup">
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="font-semibold"
            >
              <Link href="/explore-jobs">Explore open jobs</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
