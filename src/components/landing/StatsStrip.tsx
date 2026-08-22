"use client";

import {
  Briefcase,
  Building2,
  DollarSign,
  Users,
  type LucideIcon,
} from "lucide-react";

import { usePublicJobStats } from "@/features/jobs";
import { cn } from "@/shared/libs/shadCnConfig";
import { formatMinor } from "@/shared/utils/money";

interface StatCell {
  icon: LucideIcon;
  value: string;
  label: string;
}

/**
 * The marketplace numbers under the hero, live from the public stats endpoint —
 * a single row of circular-icon stats (Open Jobs, Companies, Recruiters, Avg.
 * Fee Offered). Marketing must never break on an API hiccup: while loading or
 * on error the strip simply doesn't render.
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
      label: "Companies",
    },
    {
      icon: Users,
      value: data.recruiters.toLocaleString("en-US"),
      label: "Recruiters",
    },
    {
      icon: DollarSign,
      value: formatMinor(data.averageFeeMinor),
      label: "Avg. Fee Offered",
    },
  ];

  return (
    <div
      aria-label="Marketplace statistics"
      className="grid grid-cols-2 gap-y-5 sm:grid-cols-4"
    >
      {cells.map((cell, index) => {
        const Icon = cell.icon;
        return (
          <div
            key={cell.label}
            className={cn(
              "flex items-center gap-2.5",
              // Vertical divider between the four stats on the single-row layout.
              index > 0 && "sm:border-l sm:border-brand-line sm:pl-4",
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-lg font-extrabold leading-none text-navy">
                {cell.value}
              </p>
              <p className="mt-1 text-[11px] text-brand-gray">{cell.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
