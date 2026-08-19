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
    <div aria-label="Marketplace statistics" className="grid grid-cols-2 gap-3">
      {cells.map((cell) => {
        const Icon = cell.icon;
        return (
          <div
            key={cell.label}
            className="flex items-center gap-3 rounded-md border border-brand-line bg-white px-4 py-3 shadow-card"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-extrabold text-navy">
                {cell.value}
              </p>
              <p className="truncate text-xs text-brand-gray">{cell.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
