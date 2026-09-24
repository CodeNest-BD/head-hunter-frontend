"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { billingKeys } from "../keys";

const REFRESH_TICKS = 6;
const REFRESH_INTERVAL_MS = 2500;

type BillingQueryKey = readonly unknown[];

/**
 * Returning from a Stripe-dependent action races the webhook that actually
 * applies the change (top-up credit, Connect account verification), so the
 * data the user lands on can be moments stale. Bursting invalidations over a
 * short window (6 × 2.5s) catches the webhook without a manual refresh.
 * Shared by the company wallet (after checkout) and the recruiter wallet
 * (after bank setup) so the window is tuned in one place.
 *
 * Pass `keys` to scope what refetches; it defaults to all billing queries.
 * Calling start() during a running burst restarts the window, so a second
 * action late in a burst still gets a full 15 seconds of coverage.
 */
export function useBillingRefreshBurst(
  keys: readonly BillingQueryKey[] = [billingKeys.all],
): { start: () => void } {
  // A monotonically increasing generation, so re-starting mid-burst re-runs
  // the effect (a boolean would no-op on the second start).
  const [generation, setGeneration] = useState(0);
  const queryClient = useQueryClient();
  // Stable identity so callers can list it in effect/callback deps safely.
  const start = useCallback(() => setGeneration((n) => n + 1), []);

  useEffect(() => {
    if (generation === 0) return;
    const invalidate = () => {
      for (const queryKey of keys) {
        void queryClient.invalidateQueries({ queryKey });
      }
    };
    let ticks = 0;
    invalidate();
    const id = setInterval(() => {
      ticks += 1;
      invalidate();
      if (ticks >= REFRESH_TICKS) {
        clearInterval(id);
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
    // `keys` is intentionally spread-stable per caller (module-level constants);
    // the effect re-runs per burst generation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation, queryClient]);

  return { start };
}
