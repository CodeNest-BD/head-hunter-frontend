import type { LucideIcon } from "lucide-react";
import { FilePen, Globe2, Handshake, Users } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

/** Client-approved copy, verbatim from landing-page-content.txt. */
const STEPS: readonly Step[] = [
  {
    icon: FilePen,
    title: "1. Companies Post",
    body: "Post your job and name your own price for a successful placement.",
  },
  {
    icon: Globe2,
    title: "2. Recruiters Discover",
    body: "Recruiters explore live jobs on the map and choose the roles to pursue relevant to their experience.",
  },
  {
    icon: Users,
    title: "3. You Get Candidates",
    body: "Qualified candidates sent from experienced recruiters show up in your inbox.",
  },
  {
    icon: Handshake,
    title: "4. Hire & Pay",
    body: "Hire the right person and pay the agreed upon fee. It’s that simple.",
  },
];

/**
 * The four-step band on the blue section tint, matching the client reference:
 * icon in a white circle, bold dark-blue step title, grey body copy.
 */
export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-secondary">
      <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-10">
        <h2 className="mb-10 text-center font-heading text-3xl font-extrabold text-navy md:text-4xl">
          How It Works
        </h2>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex flex-col items-start gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-card">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="font-heading text-lg font-extrabold text-primary">
                  {step.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-brand-slate">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
