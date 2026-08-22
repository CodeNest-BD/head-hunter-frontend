import { useEffect, useState } from "react";

type CitiesByState = Readonly<Record<string, readonly string[]>>;

// The full Census place dataset is ~400KB, so it is dynamically imported the
// first time any state is selected and then memoised at module scope — every
// consumer after that resolves synchronously from the cache.
let cache: CitiesByState | null = null;
let inFlight: Promise<CitiesByState> | null = null;

function loadCitiesByState(): Promise<CitiesByState> {
  if (cache) {
    return Promise.resolve(cache);
  }
  inFlight ??= import("@/shared/data/usCitiesByState").then((module) => {
    cache = module.US_CITIES_BY_STATE;
    return cache;
  });
  return inFlight;
}

/**
 * Every populated place in `stateCode`, alphabetical, loaded on demand. Returns
 * an empty array until the dataset resolves (or when no state is selected), so
 * callers can render a disabled/placeholder state without special-casing.
 */
export function useStateCities(
  stateCode: string | undefined,
): readonly string[] {
  const [data, setData] = useState<CitiesByState | null>(cache);

  useEffect(() => {
    if (!stateCode || data) {
      return;
    }
    let active = true;
    void loadCitiesByState().then((loaded) => {
      if (active) {
        setData(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, [stateCode, data]);

  return stateCode ? (data?.[stateCode] ?? []) : [];
}
