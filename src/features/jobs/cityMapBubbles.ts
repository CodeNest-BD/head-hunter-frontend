import { projectAlbersUsa } from "@/shared/data/albersUsa";
import { US_CITIES } from "@/shared/data/usCities";

/** A per-city aggregate row from a job-map endpoint (city may be unrecorded). */
export interface CityMapRow {
  readonly locationState: string;
  readonly locationCity: string | null;
  readonly openRoles: number;
  readonly averageFeeMinor: number;
}

/** A placeable city bubble: its projected point in the 960x600 map frame. */
export interface CityMapBubble {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly state: string;
  readonly city: string;
  readonly openRoles: number;
  readonly averageFeeMinor: number;
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
    { point: CityPoint; openRoles: number; feeWeighted: number }
  >();
  for (const row of rows) {
    if (!row.locationCity || row.openRoles <= 0) continue;
    const norm = normalizeCity(row.locationCity);
    const point =
      CITY_BY_NAME_STATE.get(`${norm}|${row.locationState}`) ??
      CITY_BY_NAME.get(norm);
    if (!point) continue;
    const key = `${point.name}|${point.state}`;
    const prev = byPoint.get(key) ?? { point, openRoles: 0, feeWeighted: 0 };
    prev.openRoles += row.openRoles;
    prev.feeWeighted += row.averageFeeMinor * row.openRoles;
    byPoint.set(key, prev);
  }
  return [...byPoint.values()].map(({ point, openRoles, feeWeighted }) => ({
    key: `${point.name}|${point.state}`,
    x: point.x,
    y: point.y,
    state: point.state,
    city: point.name,
    openRoles,
    averageFeeMinor: openRoles > 0 ? Math.round(feeWeighted / openRoles) : 0,
  }));
}
