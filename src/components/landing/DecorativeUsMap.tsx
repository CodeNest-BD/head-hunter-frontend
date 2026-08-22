"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { usePublicJobMap } from "@/features/jobs";
import {
  resolveCityBubbles,
  type CityMapBubble,
} from "@/features/jobs/cityMapBubbles";
import {
  US_STATES,
  US_STATE_NAME_BY_CODE,
  US_VIEWBOX,
} from "@/shared/data/usStatesGeo";
import { formatMinor } from "@/shared/utils/money";

/**
 * The hero's USA map, driven by live per-city open-role counts from the public
 * job-map endpoint. Bubble positions use the same Albers projection as the
 * recruiter map, so each city sits on its actual geography; hovering a bubble
 * reveals its popup. We show the busiest cities to keep the hero uncluttered.
 */

const MAX_BUBBLES = 8;

/** Radius in the 960x600 frame — sqrt so a huge city can't dwarf a small one. */
function bubbleRadius(count: number): number {
  return Math.min(32, 12 + Math.sqrt(count) * 3.5);
}

export function DecorativeUsMap() {
  const { data } = usePublicJobMap();
  const [active, setActive] = useState<CityMapBubble | null>(null);

  const bubbles = useMemo(() => {
    return resolveCityBubbles(data ?? [])
      .sort((a, b) => b.openRoles - a.openRoles)
      .slice(0, MAX_BUBBLES);
  }, [data]);

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${US_VIEWBOX.width} ${US_VIEWBOX.height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Map of open roles across the United States"
      >
        {US_STATES.map((state) => (
          <path
            key={state.code}
            d={state.d}
            fill="#EEF4FD"
            stroke="#FFFFFF"
            strokeWidth={1.1}
          />
        ))}
        {bubbles.map((bubble) => {
          const isActive = active?.key === bubble.key;
          const r = bubbleRadius(bubble.openRoles);
          return (
            <g
              key={bubble.key}
              className="cursor-pointer"
              onMouseEnter={() => setActive(bubble)}
              onMouseLeave={() =>
                setActive((current) =>
                  current?.key === bubble.key ? null : current,
                )
              }
            >
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={r + 8}
                fill="#4F80E6"
                opacity={isActive ? 0.24 : 0.16}
              />
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={r}
                fill={isActive ? "#034AEF" : "#85B1F3"}
                opacity={isActive ? 0.95 : 0.85}
              />
              <text
                x={bubble.x}
                y={bubble.y + 5}
                textAnchor="middle"
                fontSize={r >= 25 ? 17 : 14}
                fontWeight={800}
                fill="#FFFFFF"
              >
                {bubble.openRoles}
              </text>
              <text
                x={bubble.x}
                y={bubble.y + r + 18}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill="#323A52"
              >
                {bubble.city}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover popup — appears only while a bubble is hovered. */}
      {active && (
        <div
          className="pointer-events-none absolute hidden w-52 -translate-x-1/2 -translate-y-full rounded-md border border-brand-line bg-white p-4 shadow-card-lg sm:block"
          style={{
            left: `min(max(${(active.x / US_VIEWBOX.width) * 100}%, 6rem), calc(100% - 6rem))`,
            top: `${(active.y / US_VIEWBOX.height) * 100 - 4}%`,
          }}
        >
          <p className="text-sm font-extrabold text-navy">
            {active.city}, {US_STATE_NAME_BY_CODE[active.state] ?? active.state}
          </p>
          <p className="mt-0.5 text-sm font-bold text-primary">
            {active.openRoles} Open Roles
          </p>
          <p className="mt-2 text-xs text-brand-gray">Avg. Company Price</p>
          <p className="text-xl font-extrabold text-navy">
            {formatMinor(active.averageFeeMinor)}
          </p>
        </div>
      )}

      <p className="mt-2 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray">
        Live openings ·{" "}
        <Link
          href="/explore-jobs"
          className="text-brand-secondary underline-offset-2 hover:underline"
        >
          explore jobs
        </Link>
      </p>
    </div>
  );
}
