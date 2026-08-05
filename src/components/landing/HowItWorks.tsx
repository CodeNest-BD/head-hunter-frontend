import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * "How it works" section copied from the v2 mock: the welcome headline plus two
 * portal cards (Recruiters / Employers) with a soft blue-tinted gradient face,
 * an illustrative icon, a description, and a portal link.
 */
export function HowItWorks() {
  return (
    <section
      id="how"
      className="scroll-mt-20 bg-background px-5 py-20 text-center md:px-10 md:py-24"
    >
      <h2 className="font-heading text-4xl font-extrabold tracking-[-0.02em] text-navy sm:text-5xl">
        Welcome to HeadHunter.com
      </h2>
      <p className="mt-3.5 text-2xl font-medium tracking-[-0.01em] text-[#7A8290] sm:text-[31px]">
        Set Your Price. Hire the Right Talent.
      </p>

      <div className="mx-auto mt-16 grid max-w-5xl gap-10 md:grid-cols-2">
        <PortalCard
          title="Recruiters"
          gradient="linear-gradient(160deg,#F7F9FC 0%,#E9EEF7 55%,#DFE7F3 100%)"
          icon={<RecruitersIcon />}
          description="Immediately locate open positions with employers willing to pay for professional recruiting services."
          linkLabel="Go to Recruiter Portal"
        />
        <PortalCard
          title="Employers"
          gradient="linear-gradient(200deg,#F7F9FC 0%,#E9EEF7 55%,#DFE7F3 100%)"
          icon={<EmployersIcon />}
          description="Find the perfect recruiter to fill your role with the best talent at a price within your budget."
          linkLabel="Go to Employer Portal"
        />
      </div>
    </section>
  );
}

interface PortalCardProps {
  title: string;
  gradient: string;
  icon: React.ReactNode;
  description: string;
  linkLabel: string;
}

function PortalCard({
  title,
  gradient,
  icon,
  description,
  linkLabel,
}: PortalCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-5 rounded-[18px] border border-border p-10 shadow-card"
      style={{ background: gradient }}
    >
      <div className="font-heading text-[32px] font-extrabold text-primary">
        {title}
      </div>
      {icon}
      <p className="max-w-sm text-lg leading-relaxed text-[#2B3444]">
        {description}
      </p>
      <Link
        href="/signup"
        className="inline-flex items-center gap-1 text-lg font-bold text-primary hover:text-[#1740B8]"
      >
        {linkLabel}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function RecruitersIcon() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      stroke="#2966E8"
      strokeWidth="4"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="17" />
      <path d="M52 66 q8 7 16 0" strokeWidth="3" />
      <circle cx="56" cy="56" r="1.5" fill="#2966E8" />
      <circle cx="64" cy="56" r="1.5" fill="#2966E8" />
      <circle cx="60" cy="16" r="10" />
      <circle cx="60" cy="104" r="10" />
      <circle cx="16" cy="60" r="10" />
      <circle cx="104" cy="60" r="10" />
      <circle cx="27" cy="27" r="10" />
      <circle cx="93" cy="27" r="10" />
      <circle cx="27" cy="93" r="10" />
      <circle cx="93" cy="93" r="10" />
      <line x1="60" y1="27" x2="60" y2="42" />
      <line x1="60" y1="78" x2="60" y2="93" />
      <line x1="27" y1="60" x2="42" y2="60" />
      <line x1="78" y1="60" x2="93" y2="60" />
      <line x1="34" y1="34" x2="47" y2="47" />
      <line x1="86" y1="34" x2="73" y2="47" />
      <line x1="34" y1="86" x2="47" y2="73" />
      <line x1="86" y1="86" x2="73" y2="73" />
    </svg>
  );
}

function EmployersIcon() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      stroke="#2966E8"
      strokeWidth="4"
      aria-hidden="true"
    >
      <rect x="52" y="14" width="56" height="38" rx="4" />
      <text
        x="80"
        y="34"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill="#2966E8"
        stroke="none"
        fontFamily="inherit"
      >
        JOB
      </text>
      <line x1="60" y1="42" x2="100" y2="42" strokeWidth="3" />
      <circle cx="34" cy="34" r="11" />
      <path d="M16 62 q18 -12 36 0 l0 12 -36 0 Z" />
      <circle cx="62" cy="72" r="12" />
      <path d="M42 104 q20 -14 40 0 l0 8 -40 0 Z" />
      <circle cx="94" cy="76" r="10" />
      <path d="M78 104 q16 -11 32 0 l0 8 -32 0 Z" />
    </svg>
  );
}
