import Link from "next/link";
import { ShieldCheck, Store, Zap, type LucideIcon } from "lucide-react";
import { Logo } from "@/shared/ui-components/layout/Logo";

const BRAND_HIGHLIGHTS: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    icon: Store,
    title: "A curated marketplace",
    body: "Companies and specialist recruiters, matched on the placements that matter.",
  },
  {
    icon: Zap,
    title: "Built for momentum",
    body: "Track candidates, references, and payouts in one focused workspace.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted by design",
    body: "Verified accounts and secure sign-in keep every engagement protected.",
  },
];

/**
 * Auth chrome — a premium split screen on desktop (brand panel + form),
 * collapsing to a stacked logo-over-form layout on mobile. Deliberately does
 * not use DashboardLayout: unauthenticated flows own their own frame.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-background text-foreground lg:h-screen lg:grid-cols-[2fr_3fr] lg:overflow-hidden">
      {/* Brand panel — desktop only. */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#0b1526] via-[#0d1b31] to-[#0b1526] lg:flex lg:flex-col lg:justify-between lg:p-14">
        {/* Soft drifting blue glows, echoing the landing aesthetic. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-44 h-[520px] w-[520px] rounded-full opacity-70 blur-[2px] animate-pulse [animation-duration:6s]"
          style={{
            background:
              "radial-gradient(circle, rgba(37,99,235,0.22), transparent 65%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-52 -left-40 h-[560px] w-[560px] rounded-full opacity-70 animate-pulse [animation-duration:8s]"
          style={{
            background:
              "radial-gradient(circle, rgba(37,99,235,0.14), transparent 65%)",
          }}
        />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Logo tone="onDark" />
          </Link>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#85B1F3]/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#B4DBFD]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4F80E6] animate-pulse" />
            The recruiting marketplace
          </span>
          <h1 className="mt-7 font-heading text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] text-white text-balance">
            Where great companies meet great recruiters.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/70">
            One focused workspace to source talent, manage placements, and get
            paid — without the noise.
          </p>

          <ul className="mt-10 space-y-5">
            {BRAND_HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#85B1F3] ring-1 ring-inset ring-white/10"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/60">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          aria-hidden="true"
          className="relative h-[3px] w-56 overflow-hidden rounded-full bg-slate-400/20"
        >
          <div
            className="h-full w-2/5 rounded-full animate-[gradient-shift_8s_linear_infinite]"
            style={{
              background:
                "linear-gradient(90deg, transparent, #4F80E6, #85B1F3, transparent)",
              backgroundSize: "200% 100%",
            }}
          />
        </div>
      </aside>

      {/* Form column — the only scroller on desktop, so a tall form (sign-up)
       * never shifts the fixed brand panel. `min-h-full` keeps short forms
       * (sign-in) vertically centred while letting tall ones scroll from the
       * top without the flex-centering clip. */}
      <section className="lg:h-screen lg:overflow-y-auto">
        {/* `justify-center` at every width closes the dead band under a short
         * form on a phone. Safe against the flex-centring clip because the
         * height here is a minimum, not a fixed one — a tall form grows the
         * box instead of overflowing it. */}
        <div className="flex min-h-full flex-col items-center justify-center px-5 py-10 sm:px-8 lg:px-14 lg:py-12">
          {/* Mobile logo — the brand panel is hidden below lg, so this is the
           * only brand mark on the page and carries it at full size. */}
          <div className="mb-8 lg:hidden">
            <Link
              href="/"
              className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Logo size="lg" />
            </Link>
          </div>
          <div className="flex w-full max-w-md flex-col">{children}</div>
        </div>
      </section>
    </main>
  );
}
