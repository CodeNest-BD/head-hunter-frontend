// Inline albers-usa projection (no runtime d3 dependency).
//
// A faithful port of d3-geo's geoAlbersUsa composite: three Albers
// conic-equal-area sub-projections — the contiguous 48, Alaska, and Hawaii —
// with the parameters d3 ships, placed into the same 960x600 frame the state
// paths were generated in (geoAlbersUsa().scale(1070).translate([480,300])).
// The region boxes below are d3's own composite clip extents, so a lat/lng
// lands in the same pixel as the matching state path. Numerically verified
// to <0.1px against d3-geo for NYC, LA, Miami, Seattle, Chicago, Denver,
// Houston, Anchorage & Honolulu (see scratchpad verify script).

const DEG = Math.PI / 180;

export interface ProjectedPoint {
  x: number;
  y: number;
}

/**
 * One Albers conic-equal-area sub-projection.
 *
 * `rotateLng` is the composite's longitude rotation (the raw central meridian
 * sits at `-rotateLng`); `centerRotLng`/`centerLat` is the projection center in
 * the rotated frame, which d3 subtracts so it maps to `translate`; `p0`/`p1`
 * are the standard parallels. The result is then scaled and translated into
 * the shared 960x600 frame.
 */
function makeAlbers(
  rotateLng: number,
  centerRotLng: number,
  centerLat: number,
  p0: number,
  p1: number,
  scale: number,
  tx: number,
  ty: number,
): (lng: number, lat: number) => ProjectedPoint {
  const sinP0 = Math.sin(p0 * DEG);
  const n = (sinP0 + Math.sin(p1 * DEG)) / 2;
  const c = 1 + sinP0 * (2 * n - sinP0);
  const rho0 = Math.sqrt(c) / n;

  const raw = (lng: number, lat: number): [number, number] => {
    const lambda = (lng + rotateLng) * DEG;
    const r = Math.sqrt(c - 2 * n * Math.sin(lat * DEG)) / n;
    const t = n * lambda;
    return [r * Math.sin(t), rho0 - r * Math.cos(t)];
  };

  // Center point in the rotated frame maps to the translate anchor.
  const [ccx, ccy] = raw(centerRotLng - rotateLng, centerLat);

  return (lng, lat) => {
    const [rx, ry] = raw(lng, lat);
    return {
      x: scale * (rx - ccx) + tx,
      y: scale * -(ry - ccy) + ty,
    };
  };
}

const S = 1070;
const TX = 480;
const TY = 300;

const lower48 = makeAlbers(96, -0.6, 38.7, 29.5, 45.5, S, TX, TY);
const alaska = makeAlbers(
  154,
  -2,
  58.5,
  55,
  65,
  0.35 * S,
  TX - 0.307 * S,
  TY + 0.201 * S,
);
const hawaii = makeAlbers(
  157,
  -3,
  19.9,
  8,
  18,
  S,
  TX - 0.205 * S,
  TY + 0.212 * S,
);

function inBox(
  p: ProjectedPoint,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): boolean {
  return p.x >= x0 && p.x < x1 && p.y >= y0 && p.y < y1;
}

/**
 * Project a WGS84 lng/lat into the 960x600 albers-usa frame, or null when the
 * point falls outside every US sub-region (matching d3's composite clip). The
 * clip boxes match d3's geoAlbersUsa point-dispatch extents.
 */
export function projectAlbersUsa(
  lng: number,
  lat: number,
): ProjectedPoint | null {
  const lower = lower48(lng, lat);
  if (inBox(lower, TX - 0.455 * S, TY - 0.238 * S, TX + 0.455 * S, TY + 0.238 * S)) {
    return lower;
  }

  const ak = alaska(lng, lat);
  if (inBox(ak, TX - 0.425 * S, TY + 0.12 * S, TX - 0.214 * S, TY + 0.234 * S)) {
    return ak;
  }

  const hi = hawaii(lng, lat);
  if (inBox(hi, TX - 0.214 * S, TY + 0.166 * S, TX - 0.115 * S, TY + 0.234 * S)) {
    return hi;
  }

  return null;
}
