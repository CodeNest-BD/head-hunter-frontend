"use client";

import { useState } from "react";
import Link from "next/link";

import { projectAlbersUsa } from "@/shared/data/albersUsa";
import { US_STATES, US_VIEWBOX } from "@/shared/data/usStatesGeo";

/**
 * The hero's illustrative USA map. Static data on purpose (live per-state
 * numbers are reserved for verified recruiters), but interactive: hovering a
 * city bubble reveals its popup — the card is not permanently pinned. Bubble
 * positions use the same Albers projection as the real map, so each city sits
 * on its actual geography.
 */

interface SampleBubble {
  city: string;
  label: string;
  state: string;
  lat: number;
  lng: number;
  count: number;
  avgPrice: string;
  /** Bubble radius in the 960x600 frame. */
  r: number;
}

const SAMPLE_BUBBLES: readonly SampleBubble[] = [
  {
    city: "New York",
    label: "New York",
    state: "NY",
    lat: 40.7128,
    lng: -74.006,
    count: 432,
    avgPrice: "$6,750",
    r: 30,
  },
  {
    city: "San Francisco",
    label: "San Francisco",
    state: "CA",
    lat: 37.7749,
    lng: -122.4194,
    count: 213,
    avgPrice: "$8,200",
    r: 25,
  },
  {
    city: "Austin",
    label: "Austin",
    state: "TX",
    lat: 30.2672,
    lng: -97.7431,
    count: 156,
    avgPrice: "$5,400",
    r: 22,
  },
  {
    city: "Chicago",
    label: "Chicago",
    state: "IL",
    lat: 41.8781,
    lng: -87.6298,
    count: 187,
    avgPrice: "$6,100",
    r: 23,
  },
  {
    city: "Miami",
    label: "Miami",
    state: "FL",
    lat: 25.7617,
    lng: -80.1918,
    count: 98,
    avgPrice: "$4,900",
    r: 18,
  },
];

const plotted = SAMPLE_BUBBLES.flatMap((bubble) => {
  const point = projectAlbersUsa(bubble.lng, bubble.lat);
  return point ? [{ ...bubble, x: point.x, y: point.y }] : [];
});

type PlottedBubble = (typeof plotted)[number];

export function DecorativeUsMap() {
  const [active, setActive] = useState<PlottedBubble | null>(null);

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${US_VIEWBOX.width} ${US_VIEWBOX.height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Illustrative map of open roles across the United States"
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
        {plotted.map((bubble) => {
          const isActive = active?.city === bubble.city;
          return (
            <g
              key={bubble.city}
              className="cursor-pointer"
              onMouseEnter={() => setActive(bubble)}
              onMouseLeave={() =>
                setActive((current) =>
                  current?.city === bubble.city ? null : current,
                )
              }
            >
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.r + 8}
                fill="#4F80E6"
                opacity={isActive ? 0.24 : 0.16}
              />
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.r}
                fill={isActive ? "#034AEF" : "#85B1F3"}
                opacity={isActive ? 0.95 : 0.85}
              />
              <text
                x={bubble.x}
                y={bubble.y + 5}
                textAnchor="middle"
                fontSize={bubble.r >= 25 ? 17 : 14}
                fontWeight={800}
                fill="#FFFFFF"
              >
                {bubble.count}
              </text>
              <text
                x={bubble.x}
                y={bubble.y + bubble.r + 18}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill="#323A52"
              >
                {bubble.label}
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
            {active.label}, {active.state}
          </p>
          <p className="mt-0.5 text-sm font-bold text-primary">
            {active.count} Open Roles
          </p>
          <p className="mt-2 text-xs text-brand-gray">Avg. Company Price</p>
          <p className="text-xl font-extrabold text-navy">{active.avgPrice}</p>
        </div>
      )}

      <p className="mt-2 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray">
        Illustrative preview ·{" "}
        <Link
          href="/explore-jobs"
          className="text-brand-secondary underline-offset-2 hover:underline"
        >
          see live jobs
        </Link>
      </p>
    </div>
  );
}
