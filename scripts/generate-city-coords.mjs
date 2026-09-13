/**
 * Generates `src/shared/data/usCityCoords.ts`: real WGS84 coordinates for the
 * client-supplied city list, so every live-map bubble lands on its actual
 * location instead of the state centroid.
 *
 * Sources (both in requirements/usa-cities/):
 *  - usa_cities_by_state.csv  — the canonical 20k city list (client-supplied)
 *  - uscities.csv             — SimpleMaps US Cities database (CC BY 4.0):
 *    ~28k US cities/CDPs with lat/lng + county. https://simplemaps.com/data/us-cities
 *
 * For each client city we take, in order: an exact (state, city) coordinate
 * match; else the centroid of that (state, county) derived by averaging every
 * coordinated city in the county (so a place the source lacks still lands in the
 * right county, not at the state centre). A city we can resolve neither way is
 * omitted and falls back to the state centroid at runtime.
 *
 * The column names are auto-detected, so either the SimpleMaps schema
 * (city/state_id/county_name/lat/lng) or a Census-style one
 * (CITY/STATE_CODE/COUNTY/LATITUDE/LONGITUDE) works.
 *
 * Run: `npm run generate:city-coords`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const cityListPath = join(
  root,
  "requirements/usa-cities/usa_cities_by_state.csv",
);
const coordsPath = join(root, "requirements/usa-cities/uscities.csv");
const outPath = join(root, "src/shared/data/usCityCoords.ts");

/** Minimal RFC-4180 CSV line parser (handles quoted fields with commas). */
function parseLine(line) {
  const out = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

function readCsv(path) {
  const raw = readFileSync(path, "utf8").replace(/^﻿/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  const header = parseLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map(parseLine);
  return { header, rows };
}

const norm = (s) => s.trim().toLowerCase();
const round = (n) => Math.round(n * 1e4) / 1e4;

/**
 * A tiny deterministic offset (~1.5 km) seeded by the city key, applied only to
 * county-centroid fallbacks so several cities sharing one county don't stack on
 * the exact same point. Negligible for a lone city; enough to separate a few.
 */
function jitter(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1)
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  const angle = (Math.abs(h) % 360) * (Math.PI / 180);
  const radius = 0.015; // degrees
  return { dlat: Math.sin(angle) * radius, dlng: Math.cos(angle) * radius };
}

// --- Coordinate source: per-city coords + per-county centroid accumulator ----
const coords = readCsv(coordsPath);
/** First header index that matches any of the candidate names. */
const col = (...names) => {
  for (const name of names) {
    const i = coords.header.indexOf(name);
    if (i !== -1) return i;
  }
  return -1;
};
const c = {
  code: col("state_id", "STATE_CODE"),
  city: col("city", "CITY"),
  county: col("county_name", "COUNTY"),
  lat: col("lat", "LATITUDE"),
  lng: col("lng", "LONGITUDE"),
};
if (Object.values(c).some((i) => i === -1)) {
  throw new Error(`Unexpected coords header: ${coords.header.join(", ")}`);
}

/** `${STATE}|${normCity}` -> [lat, lng] */
const cityCoord = new Map();
/** `${STATE}|${normCounty}` -> { lat, lng, n } running mean */
const countyAcc = new Map();

for (const row of coords.rows) {
  const state = row[c.code]?.trim();
  const lat = Number(row[c.lat]);
  const lng = Number(row[c.lng]);
  if (!state || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  const cityKey = `${state}|${norm(row[c.city] ?? "")}`;
  if (!cityCoord.has(cityKey)) cityCoord.set(cityKey, [lat, lng]);
  const countyRaw = (row[c.county] ?? "").trim();
  if (countyRaw) {
    const key = `${state}|${norm(countyRaw)}`;
    const acc = countyAcc.get(key) ?? { lat: 0, lng: 0, n: 0 };
    acc.lat += lat;
    acc.lng += lng;
    acc.n += 1;
    countyAcc.set(key, acc);
  }
}

// --- Resolve every client city to a coordinate --------------------------------
const list = readCsv(cityListPath);
const l = {
  city: list.header.indexOf("City"),
  code: list.header.indexOf("State Code"),
  county: list.header.indexOf("County"),
};
if (l.city === -1 || l.code === -1) {
  throw new Error(`Unexpected city-list header: ${list.header.join(", ")}`);
}

/** state -> { cityName: [lat, lng] } */
const byState = {};
const stats = { total: 0, byCity: 0, byCounty: 0, unresolved: 0 };

for (const row of list.rows) {
  const city = (row[l.city] ?? "").trim();
  const state = (row[l.code] ?? "").trim();
  if (!city || !state) continue;
  stats.total += 1;

  let point = cityCoord.get(`${state}|${norm(city)}`);
  if (point) {
    stats.byCity += 1;
  } else {
    const county = l.county === -1 ? "" : (row[l.county] ?? "").trim();
    const acc = county && countyAcc.get(`${state}|${norm(county)}`);
    if (acc && acc.n > 0) {
      const j = jitter(`${state}|${norm(city)}`);
      point = [acc.lat / acc.n + j.dlat, acc.lng / acc.n + j.dlng];
      stats.byCounty += 1;
    }
  }
  if (!point) {
    stats.unresolved += 1;
    continue;
  }

  (byState[state] ??= {})[city] = [round(point[0]), round(point[1])];
}

// --- Emit ---------------------------------------------------------------------
const states = Object.keys(byState).sort();
let body = "";
for (const state of states) {
  const entries = Object.entries(byState[state]).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  body += `  ${JSON.stringify(state)}: {\n`;
  for (const [city, [lat, lng]] of entries) {
    body += `    ${JSON.stringify(city)}: [${lat}, ${lng}],\n`;
  }
  body += `  },\n`;
}

const out = `// GENERATED by scripts/generate-city-coords.mjs — do not edit by hand.
// Real WGS84 coordinates (decimal degrees, 4 dp ~= 11 m) for the client city
// list, so every live-map bubble lands on its true location. Exact city coords
// where known, otherwise the city's county centroid; keyed by USPS state code
// then the city name exactly as the picker offers it.
//
// City coordinates: SimpleMaps US Cities database (CC BY 4.0) —
// https://simplemaps.com/data/us-cities — joined to the client city list
// (requirements/usa-cities/usa_cities_by_state.csv). Regenerate with
// \`npm run generate:city-coords\`.

export const US_CITY_COORDS: Readonly<
  Record<string, Readonly<Record<string, readonly [number, number]>>>
> = {
${body}};
`;

writeFileSync(outPath, out, "utf8");
console.log(
  `Wrote ${outPath}\n  ${stats.total} cities: ${stats.byCity} exact, ${stats.byCounty} by county, ${stats.unresolved} unresolved`,
);
