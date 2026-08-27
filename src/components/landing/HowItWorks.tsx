import type { LucideIcon } from "lucide-react";
import { FilePen, Globe2, Handshake, Users } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

/** Client-approved copy, verbatim from the reference. */
const STEPS: readonly Step[] = [
  {
    icon: FilePen,
    title: "1. Companies Post",
    body: "Post your job and name the fee you’re willing to pay for successful placement.",
  },
  {
    icon: Globe2,
    title: "2. Recruiters Discover",
    body: "Recruiters explore live jobs on the map and choose the ones they want to pursue.",
  },
  {
    icon: Users,
    title: "3. You Get Candidates",
    body: "Qualified candidates are submitted to you by top recruiting professionals.",
  },
  {
    icon: Handshake,
    title: "4. Hire & Pay",
    body: "Hire the right person and pay the agreed-upon fee. It’s that simple.",
  },
];

/**
 * The four-step band on the blue section tint, per the client reference: each
 * step is an icon in a white circle to the left of a blue numbered title and
 * grey body copy, laid out in a single row.
 */
export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-secondary">
      <div className="mx-auto max-w-[1240px] px-4 py-14 sm:px-5 md:px-10">
        <h2 className="mb-10 text-center font-heading text-3xl font-extrabold text-navy md:text-4xl">
          How It Works
        </h2>
        <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex items-start gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-card">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-[15px] font-bold text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-brand-slate">
                    {step.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
