import Link from "next/link";

import { projectAlbersUsa } from "@/shared/data/albersUsa";
import { US_STATES, US_VIEWBOX } from "@/shared/data/usStatesGeo";

/**
 * The hero's illustrative USA map. Static on purpose: live per-state numbers
 * are reserved for verified recruiters, so the public page shows the idea —
 * count bubbles over real city locations plus one example popup — without
 * leaking marketplace data. Bubble positions come from the same Albers
 * projection as the real map, so every city sits on its actual geography.
 */

interface SampleBubble {
  city: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
  /** Bubble radius in the 960x600 frame. */
  r: number;
}

const SAMPLE_BUBBLES: readonly SampleBubble[] = [
  {
    city: "New York",
    label: "New York",
    lat: 40.7128,
    lng: -74.006,
    count: 432,
    r: 30,
  },
  {
    city: "San Francisco",
    label: "San Francisco",
    lat: 37.7749,
    lng: -122.4194,
    count: 213,
    r: 25,
  },
  {
    city: "Austin",
    label: "Austin",
    lat: 30.2672,
    lng: -97.7431,
    count: 156,
    r: 22,
  },
  {
    city: "Chicago",
    label: "Chicago",
    lat: 41.8781,
    lng: -87.6298,
    count: 187,
    r: 23,
  },
  {
    city: "Miami",
    label: "Miami",
    lat: 25.7617,
    lng: -80.1918,
    count: 98,
    r: 18,
  },
];

const plotted = SAMPLE_BUBBLES.flatMap((bubble) => {
  const point = projectAlbersUsa(bubble.lng, bubble.lat);
  return point ? [{ ...bubble, x: point.x, y: point.y }] : [];
});

const featured = plotted.find((bubble) => bubble.city === "New York");

export function DecorativeUsMap() {
  return (
    <div className="relative select-none">
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${US_VIEWBOX.width} ${US_VIEWBOX.height}`}
        className="h-auto w-full"
        role="presentation"
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
        {plotted.map((bubble) => (
          <g key={bubble.city}>
            <circle
              cx={bubble.x}
              cy={bubble.y}
              r={bubble.r + 8}
              fill="#4F80E6"
              opacity={0.16}
            />
            <circle
              cx={bubble.x}
              cy={bubble.y}
              r={bubble.r}
              fill={bubble.city === "New York" ? "#034AEF" : "#85B1F3"}
              opacity={bubble.city === "New York" ? 0.92 : 0.85}
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
        ))}
      </svg>

      {/* Example popup, pinned over the featured bubble. */}
      {featured && (
        <div
          aria-hidden="true"
          className="absolute hidden w-56 -translate-x-1/2 rounded-xl border border-brand-line bg-white p-4 shadow-card-lg sm:block"
          style={{
            // Clamped so the card never overflows the frame on the NY coast.
            left: `min(${(featured.x / US_VIEWBOX.width) * 100}%, calc(100% - 7.5rem))`,
            top: `${(featured.y / US_VIEWBOX.height) * 100 - 38}%`,
          }}
        >
          <p className="text-sm font-extrabold text-navy">New York, NY</p>
          <p className="mt-0.5 text-sm font-bold text-primary">
            432 Open Roles
          </p>
          <p className="mt-2 text-xs text-brand-gray">Avg. Company Price</p>
          <p className="text-xl font-extrabold text-navy">$6,750</p>
          <span className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
            View Jobs
          </span>
        </div>
      )}

      <p className="mt-2 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-brand-gray-light">
        Illustrative preview ·{" "}
        <Link
          href="/explore-jobs"
          className="pointer-events-auto text-brand-secondary underline-offset-2 hover:underline"
        >
          see live jobs
        </Link>
      </p>
    </div>
  );
}
