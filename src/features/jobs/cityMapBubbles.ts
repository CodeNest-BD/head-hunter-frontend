import { projectAlbersUsa } from "@/shared/data/albersUsa";
import { US_CITIES } from "@/shared/data/usCities";

/**
 * The map's current selection. A city selection carries its state so the jobs
 * list can filter by state server-side and by city on the client. Modelled as a
 * discriminated union so "a city with no state" is unrepresentable. Lives here,
 * in the pure module, so the selection helpers can be unit-tested without the
 * SVG component (and to avoid a component ↔ helper import cycle).
 */
export type MapSelection =
  | { readonly kind: "none" }
  | { readonly kind: "state"; readonly state: string }
  | { readonly kind: "city"; readonly state: string; readonly city: string };

/**
 * What clicking a city bubble should select next. Clicking the already-selected
 * city clears the selection; clicking any other bubble selects that city. This
 * is the whole fix for the map's erratic clicks: bubbles now toggle their own
 * city cleanly instead of toggling their state (which cleared the map whenever
 * a second bubble in an already-selected state was clicked).
 */
export function nextBubbleSelection(
  current: MapSelection,
  bubble: { readonly state: string; readonly city: string },
): MapSelection {
  const isSelected =
    current.kind === "city" &&
    current.city === bubble.city &&
    current.state === bubble.state;
  return isSelected
    ? { kind: "none" }
    : { kind: "city", state: bubble.state, city: bubble.city };
}

/** A per-city aggregate row from a job-map endpoint (city may be unrecorded). */
export interface CityMapRow {
  readonly locationState: string;
  readonly locationCity: string | null;
  readonly openRoles: number;
  /** Total recruiter fees available across the city's live listings. */
  readonly totalFeeMinor: number;
}

/** A placeable city bubble: its projected point in the 960x600 map frame. */
export interface CityMapBubble {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly state: string;
  readonly city: string;
  readonly openRoles: number;
  /** Total recruiter fees available here — drives the bubble's size. */
  readonly totalFeeMinor: number;
}

/** The available-fee min/max across bubbles, for range-relative sizing. */
export function feeRange(bubbles: readonly { totalFeeMinor: number }[]): {
  min: number;
  max: number;
} {
  if (bubbles.length === 0) return { min: 0, max: 0 };
  let min = Infinity;
  let max = -Infinity;
  for (const bubble of bubbles) {
    if (bubble.totalFeeMinor < min) min = bubble.totalFeeMinor;
    if (bubble.totalFeeMinor > max) max = bubble.totalFeeMinor;
  }
  return { min, max };
}

/**
 * A continuous, range-relative bubble radius: the busiest city maps to
 * `maxRadius`, the quietest to `minRadius`, and everything in between scales
 * smoothly — so a $3,000 city is visibly larger than a $500 one (not a fixed
 * bucket where both look the same).
 *
 * Available fee is heavily skewed — most cities cluster low with a few very
 * large outliers — so a linear scale would squash the common range into one
 * dot. A logarithmic scale spreads that low–mid range by ratio (each doubling
 * of fee is an equal step) while still capping the outliers. When every value
 * is equal there is no relative order to convey, so all get the mid radius.
 */
export function bubbleRadius(
  value: number,
  min: number,
  max: number,
  minRadius: number,
  maxRadius: number,
): number {
  if (max <= min) return (minRadius + maxRadius) / 2;
  // +1 keeps log defined at zero; ratios are unaffected at fee scale.
  const lift = (n: number) => Math.log(n + 1);
  const t = (lift(value) - lift(min)) / (lift(max) - lift(min));
  const clamped = Math.min(1, Math.max(0, t));
  return minRadius + clamped * (maxRadius - minRadius);
}

const normalizeCity = (name: string): string => name.trim().toLowerCase();

interface CityPoint {
  readonly x: number;
  readonly y: number;
  readonly name: string;
  readonly state: string;
}

// Two lookups so a row still places when its (free-text) state is wrong or
// missing: prefer an exact name+state match, then the first city of that name.
const CITY_BY_NAME_STATE = new Map<string, CityPoint>();
const CITY_BY_NAME = new Map<string, CityPoint>();
for (const city of US_CITIES) {
  const point = projectAlbersUsa(city.lng, city.lat);
  if (!point) continue;
  const record: CityPoint = {
    x: point.x,
    y: point.y,
    name: city.name,
    state: city.state,
  };
  CITY_BY_NAME_STATE.set(`${normalizeCity(city.name)}|${city.state}`, record);
  if (!CITY_BY_NAME.has(normalizeCity(city.name))) {
    CITY_BY_NAME.set(normalizeCity(city.name), record);
  }
}

/**
 * Resolve raw per-city rows to placeable bubbles, summing duplicates that land
 * on the same city point (fee re-averaged, weighted by role count). Rows whose
 * city can't be matched to a coordinate are dropped.
 */
export function resolveCityBubbles(
  rows: readonly CityMapRow[],
): CityMapBubble[] {
  const byPoint = new Map<
    string,
    { point: CityPoint; openRoles: number; totalFeeMinor: number }
  >();
  for (const row of rows) {
    if (!row.locationCity || row.openRoles <= 0) continue;
    const norm = normalizeCity(row.locationCity);
    const point =
      CITY_BY_NAME_STATE.get(`${norm}|${row.locationState}`) ??
      CITY_BY_NAME.get(norm);
    if (!point) continue;
    const key = `${point.name}|${point.state}`;
    const prev = byPoint.get(key) ?? { point, openRoles: 0, totalFeeMinor: 0 };
    prev.openRoles += row.openRoles;
    // Available fee is a plain sum, so merging duplicate points just adds.
    prev.totalFeeMinor += row.totalFeeMinor;
    byPoint.set(key, prev);
  }
  return [...byPoint.values()].map(({ point, openRoles, totalFeeMinor }) => ({
    key: `${point.name}|${point.state}`,
    x: point.x,
    y: point.y,
    state: point.state,
    city: point.name,
    openRoles,
    totalFeeMinor,
  }));
}
