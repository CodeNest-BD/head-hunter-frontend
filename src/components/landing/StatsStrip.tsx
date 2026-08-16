"use client";

import {
  Briefcase,
  Building2,
  DollarSign,
  MapPinned,
  type LucideIcon,
} from "lucide-react";

import { usePublicJobStats } from "@/features/jobs";
import { formatMinor } from "@/shared/utils/money";

interface StatCell {
  icon: LucideIcon;
  value: string;
  label: string;
}

/**
 * The four marketplace numbers under the hero, live from the public stats
 * endpoint. Marketing must never break on an API hiccup: while loading or on
 * error the strip simply doesn't render.
 */
export function StatsStrip() {
  const { data } = usePublicJobStats();
  if (!data || data.openJobs === 0) {
    return null;
  }

  const cells: readonly StatCell[] = [
    {
      icon: Briefcase,
      value: data.openJobs.toLocaleString("en-US"),
      label: "Open Jobs",
    },
    {
      icon: Building2,
      value: data.companiesHiring.toLocaleString("en-US"),
      label: "Companies Hiring",
    },
    {
      icon: DollarSign,
      value: formatMinor(data.averageFeeMinor),
      label: "Avg. Fee Offered",
    },
    {
      icon: MapPinned,
      value: data.statesCovered.toLocaleString("en-US"),
      label: "States with Open Roles",
    },
  ];

  return (
    <section aria-label="Marketplace statistics" className="bg-background">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-4 px-5 pb-14 md:px-10 lg:grid-cols-4">
        {cells.map((cell) => {
          const Icon = cell.icon;
          return (
            <div
              key={cell.label}
              className="flex items-center gap-4 rounded-2xl border border-brand-line bg-white px-5 py-4 shadow-card"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-heading text-xl font-extrabold text-navy">
                  {cell.value}
                </p>
                <p className="truncate text-[13px] text-brand-gray">
                  {cell.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
