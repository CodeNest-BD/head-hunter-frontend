"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CreditCard,
  Lock,
} from "lucide-react";

import { formatDate } from "@/shared/utils/formatDate";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { StatusBadge } from "@/shared/ui-components/data/StatusBadge";
import { Tile } from "@/shared/ui-components/list/Tile";
import {
  useOpenSubscriptionPortal,
  useRecruiterPrice,
  useStartSubscriptionCheckout,
  useSubscription,
} from "../hooks/useBilling";
import type { SubscriptionStatus } from "../schemas";

// Display copy only — Stripe is the source of truth for the actual charge.
const PLAN_NAME = "Recruiter membership";
const PLAN_INTERVAL = "month";
const PLAN_FEATURES: readonly string[] = [
  "Full access to the 50-state job map",
  "Unlimited candidate submissions",
  "Escrow-backed, guaranteed payouts",
  "Cancel anytime",
];

type Status = SubscriptionStatus["status"];

interface StatusMeta {
  label: string;
  /** The one semantic tone the strip's glyph tile and status pill both wear,
   * so a status can never show a green tile beside an amber badge. */
  tone: "ok" | "warn" | "neutral";
  icon: typeof BadgeCheck;
}

const STATUS_META: Record<Status, StatusMeta> = {
  active: { label: "Active", tone: "ok", icon: BadgeCheck },
  past_due: { label: "Payment past due", tone: "warn", icon: AlertTriangle },
  incomplete: { label: "Incomplete", tone: "warn", icon: AlertTriangle },
  canceled: { label: "Canceled", tone: "neutral", icon: Lock },
  none: { label: "Not subscribed", tone: "neutral", icon: Lock },
};

/** One-line summary shown beside the status pill. */
function statusLine(status: Status, periodEnd: string | null): string {
  const date = periodEnd ? formatDate(periodEnd) : null;
  switch (status) {
    case "active":
      return date ? `Renews on ${date}.` : "You have full marketplace access.";
    case "past_due":
      return "Your last payment failed — update your card to keep access.";
    case "incomplete":
      return "Your last checkout didn't finish.";
    case "canceled":
      return date
        ? `Your access ended on ${date}.`
        : "Your subscription has ended.";
    case "none":
      return "Subscribe to unlock the job map and submit candidates.";
  }
}

/**
 * Recruiter billing: a status strip plus the plan card. The plan card always
 * states what the membership includes and its price; the primary action adapts
 * to the current status (subscribe / resubscribe / fix payment), while an
 * active member manages their card and cancellation from the status strip.
 */
export function SubscriptionPanel() {
  const { data, isLoading } = useSubscription();
  const { data: price } = useRecruiterPrice();
  const checkout = useStartSubscriptionCheckout();
  const portal = useOpenSubscriptionPortal();

  if (isLoading || !data) {
    return (
      <div className="h-40 animate-pulse rounded-md border border-line bg-surface-sub" />
    );
  }

  const status = data.status;
  const meta = STATUS_META[status];
  const isActive = status === "active";
  // A Stripe customer exists once any checkout has happened, so the portal is
  // reachable for every status except a never-subscribed recruiter.
  const canManageBilling = status !== "none";
  const busy = checkout.isPending || portal.isPending;
  const planPrice =
    price?.amountMinor != null ? formatMinor(price.amountMinor) : "—";

  const planAction = (() => {
    switch (status) {
      case "active":
        return null;
      case "past_due":
        return {
          label: portal.isPending ? "Opening…" : "Update payment method",
          run: () => portal.mutate(),
        };
      case "incomplete":
        return {
          label: checkout.isPending ? "Redirecting…" : "Complete subscription",
          run: () => checkout.mutate(),
        };
      case "canceled":
        return {
          label: checkout.isPending ? "Redirecting…" : "Resubscribe",
          run: () => checkout.mutate(),
        };
      case "none":
        return {
          label: checkout.isPending ? "Redirecting…" : "Subscribe",
          run: () => checkout.mutate(),
        };
    }
  })();

  return (
    <div className="flex flex-col gap-4">
      {/* Status strip */}
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Tile icon={meta.icon} tone={meta.tone} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-block font-[650] text-ink">Status</span>
              <StatusBadge label={meta.label} tone={meta.tone} />
            </div>
            <p className="mt-[3px] text-sub text-ink-muted">
              {statusLine(status, data.currentPeriodEnd)}
            </p>
          </div>
          {canManageBilling && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => portal.mutate()}
              className="sm:ml-auto"
            >
              <CreditCard />
              {portal.isPending ? "Opening…" : "Manage billing"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* `.plan` — the one place navy is a surface rather than ink: the value
          of the membership is re-sold at every renewal. */}
      <article className="overflow-hidden rounded-lg bg-navy text-rail-ink shadow-e2">
        <div className="p-6">
          <p className="text-label font-[650] uppercase text-sky">
            {PLAN_NAME}
          </p>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-1.5">
            <span className="text-[40px] font-extrabold leading-none tracking-[-0.02em] tabular-nums text-white">
              {planPrice}
            </span>
            <span className="text-block font-[550] text-rail-dim">
              / {PLAN_INTERVAL}
            </span>
            {isActive && (
              <span className="ml-auto inline-flex h-5.25 items-center gap-1.5 rounded-full bg-[#1e4620] px-2 text-[11px] font-[650] tracking-[0.02em] text-[#7be0a0]">
                <BadgeCheck className="size-3.5" />
                Current plan
              </span>
            )}
          </div>
        </div>

        <hr className="h-px border-0 bg-white/[0.12]" />

        <ul className="flex flex-col gap-3 px-6 py-5">
          {PLAN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sub">
              <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#22345a] text-[10px] font-extrabold text-[#7be0a0]">
                <Check className="size-2.5" strokeWidth={3.5} />
              </span>
              <span className="text-[#dce3f0]">{feature}</span>
            </li>
          ))}
        </ul>

        {planAction && (
          <div className="px-6 pb-6">
            <Button
              type="button"
              size="lg"
              disabled={busy}
              onClick={planAction.run}
              className="w-full sm:w-auto sm:px-8"
            >
              {planAction.label}
            </Button>
          </div>
        )}
      </article>

      {(checkout.isError || portal.isError) && (
        <p className="text-sub font-medium text-bad">
          Something went wrong talking to Stripe. Please try again.
        </p>
      )}
    </div>
  );
}
