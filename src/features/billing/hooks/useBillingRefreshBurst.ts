"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { billingKeys } from "../keys";

const REFRESH_TICKS = 6;
const REFRESH_INTERVAL_MS = 2500;

/**
 * Returning from a Stripe redirect races the webhook that actually applies the
 * change (top-up credit, Connect account verification), so the balance the
 * user lands on can be moments stale. Bursting invalidations over a short
 * window (6 × 2.5s) catches the webhook without a manual refresh. Shared by
 * the company wallet (after checkout) and the recruiter wallet (after Connect
 * onboarding) so the window is tuned in one place.
 */
export function useBillingRefreshBurst(): { start: () => void } {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  // Stable identity so callers can list it in effect/callback deps safely.
  const start = useCallback(() => setRefreshing(true), []);

  useEffect(() => {
    if (!refreshing) return;
    let ticks = 0;
    void queryClient.invalidateQueries({ queryKey: billingKeys.all });
    const id = setInterval(() => {
      ticks += 1;
      void queryClient.invalidateQueries({ queryKey: billingKeys.all });
      if (ticks >= REFRESH_TICKS) {
        clearInterval(id);
        setRefreshing(false);
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshing, queryClient]);

  return { start };
}
