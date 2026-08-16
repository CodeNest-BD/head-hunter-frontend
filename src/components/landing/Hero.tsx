import { Eyebrow } from "@/shared/ui-components/brand/Eyebrow";
import { BrandGlow } from "@/shared/ui-components/brand/BrandGlow";
import { LandingCta } from "./LandingCta";

interface Stat {
  value: string;
  label: string;
}

const STATS: readonly Stat[] = [
  { value: "$8,400", label: "avg. recruiter fee" },
  { value: "50 states", label: "on the live job map" },
  { value: "30 days", label: "placement guarantee" },
];

/**
 * Navy hero panel copied from the v2 mock: eyebrow, big white headline with a
 * light-blue accent word, the escrow sub-paragraph, two CTAs, a stat row, and
 * a stacked candidate-card preview.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <BrandGlow />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 pb-20 pt-16 md:px-10 md:pb-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="[animation:fadeUp_500ms_ease_both]">
          <span className="mb-6 inline-block rounded-full border border-[#33456B] px-3.5 py-1.5">
            <Eyebrow tone="onDark">The recruitment marketplace</Eyebrow>
          </span>
          <h1 className="mb-5 font-heading text-[40px] font-extrabold leading-[1.04] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl">
            An inbox full of <span className="text-[#4F80E6]">candidates</span>{" "}
            worth hiring.
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-relaxed text-[#C9D0DF]">
            Companies name the fee they&apos;ll pay for the right candidate.
            Freelance recruiters across all 50 states compete to deliver them.
            The fee sits in escrow until the hire sticks — a full 30-day
            guarantee.
          </p>
          <div className="mb-11 flex flex-col gap-3.5 sm:flex-row">
            <LandingCta
              role="company"
              authedHref="/company/jobs/new"
              className="h-auto rounded-[10px] px-6 py-4 text-base font-bold"
            >
              Post a job — it&apos;s free
            </LandingCta>
            <LandingCta
              role="recruiter"
              authedHref="/jobs"
              className="h-auto rounded-[10px] border border-[#3A4A6B] bg-transparent px-6 py-4 text-base font-semibold text-white hover:border-[#4F80E6] hover:bg-transparent"
            >
              Recruit on Head-Hunters
            </LandingCta>
          </div>
          <dl className="flex flex-wrap gap-10">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-heading text-[26px] font-extrabold text-white">
                  {stat.value}
                </dd>
                <p className="text-[13px] text-[#858A98]">{stat.label}</p>
              </div>
            ))}
          </dl>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

/** Stacked candidate cards — the product preview from the mock's hero. */
function HeroPreview() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-[420px] [animation:fadeUp_600ms_120ms_ease_both] lg:block"
    >
      <div className="absolute left-9 right-[-8px] top-11 rotate-[2.5deg] rounded-[14px] border border-[#2E3D5C] bg-[#1B2A4A] p-5">
        <div className="text-[15px] font-bold text-white">Tom Okafor</div>
        <div className="mt-0.5 text-[13px] text-[#858A98]">
          Senior Mechanical Engineer
        </div>
      </div>
      <div className="absolute left-[18px] right-2.5 top-[22px] -rotate-[1.5deg] rounded-[14px] border border-[#33456B] bg-[#20304F] p-5">
        <div className="text-[15px] font-bold text-white">Elena Ruiz</div>
        <div className="mt-0.5 text-[13px] text-[#858A98]">
          Senior Mechanical Engineer
        </div>
      </div>
      <div className="absolute left-0 right-7 top-24 rounded-2xl bg-white p-6 text-navy shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#8A93A3]">
            New candidate
          </div>
          <div className="rounded-full bg-primary px-3 py-1 text-[13px] font-bold text-white">
            $15,000 fee
          </div>
        </div>
        <div className="font-heading text-2xl font-extrabold text-navy">
          Marcus Bell
        </div>
        <div className="mb-3.5 mt-1 text-sm text-muted-foreground">
          Senior Mechanical Engineer · Houston, TX
        </div>
        <p className="mb-4 text-sm leading-relaxed text-[#3A4351]">
          15 years in precision fabrication and ASME-certified pressure vessel
          design. Led a 12-person team at a Tier-1 aerospace supplier…
        </p>
        <div className="mb-4 flex gap-2">
          <span className="rounded-lg border border-input px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
            📄 Resume.pdf
          </span>
          <span className="rounded-lg border border-input px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
            📄 References.pdf
          </span>
        </div>
        <div className="flex items-center gap-2.5 border-t border-[#EEF0F4] pt-3.5">
          <div className="grid h-[30px] w-[30px] place-items-center rounded-full bg-primary text-xs font-bold text-white">
            DW
          </div>
          <div className="text-[13px] text-muted-foreground">
            Submitted by <strong className="text-navy">Dana Whitfield</strong> ·
            Whitfield Search
          </div>
        </div>
      </div>
    </div>
  );
}
