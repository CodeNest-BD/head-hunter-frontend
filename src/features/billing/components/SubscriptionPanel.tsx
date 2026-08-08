"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CreditCard,
  Lock,
} from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { formatDate } from "@/shared/utils/formatDate";
import { Button } from "@/shared/ui-components/controls/button";
import {
  useOpenSubscriptionPortal,
  useStartSubscriptionCheckout,
  useSubscription,
} from "../hooks/useBilling";
import type { SubscriptionStatus } from "../schemas";

// Display copy only — Stripe is the source of truth for the actual charge.
const PLAN_NAME = "Recruiter membership";
const PLAN_PRICE = "$199";
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
  tone: "active" | "warning" | "neutral";
  icon: typeof BadgeCheck;
}

const STATUS_META: Record<Status, StatusMeta> = {
  active: { label: "Active", tone: "active", icon: BadgeCheck },
  past_due: { label: "Payment past due", tone: "warning", icon: AlertTriangle },
  incomplete: { label: "Incomplete", tone: "warning", icon: AlertTriangle },
  canceled: { label: "Canceled", tone: "neutral", icon: Lock },
  none: { label: "Not subscribed", tone: "neutral", icon: Lock },
};

const TONE_STYLES: Record<StatusMeta["tone"], string> = {
  active: "bg-[#E7F4EC] text-[#17734E] border-[#CDE7D8]",
  warning: "bg-[#FBF3DF] text-[#92610C] border-[#F0E2B8]",
  neutral: "bg-muted text-muted-foreground border-border",
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
  const checkout = useStartSubscriptionCheckout();
  const portal = useOpenSubscriptionPortal();

  if (isLoading || !data) {
    return (
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
    );
  }

  const status = data.status;
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const isActive = status === "active";
  // A Stripe customer exists once any checkout has happened, so the portal is
  // reachable for every status except a never-subscribed recruiter.
  const canManageBilling = status !== "none";
  const busy = checkout.isPending || portal.isPending;

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
    <div className="flex flex-col gap-6">
      {/* Status strip */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
              TONE_STYLES[meta.tone],
            )}
          >
            <StatusIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-navy">Status</span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-semibold",
                  TONE_STYLES[meta.tone],
                )}
              >
                {meta.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {statusLine(status, data.currentPeriodEnd)}
            </p>
          </div>
        </div>
        {canManageBilling && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => portal.mutate()}
          >
            <CreditCard className="h-[18px] w-[18px]" />
            {portal.isPending ? "Opening…" : "Manage billing"}
          </Button>
        )}
      </div>

      {/* Plan card */}
      <article className="overflow-hidden rounded-2xl bg-navy text-white shadow-card-lg">
        <div className="flex items-start justify-between gap-4 p-8 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.09em] text-[#8FB0F5]">
              {PLAN_NAME}
            </p>
            <p className="mt-2 font-heading text-[44px] font-extrabold leading-none">
              {PLAN_PRICE}
              <span className="text-[17px] font-semibold text-[#7D89A3]">
                {" "}
                / {PLAN_INTERVAL}
              </span>
            </p>
          </div>
          {isActive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4620] px-3 py-1 text-xs font-semibold text-[#7BE0A0]">
              <BadgeCheck className="h-3.5 w-3.5" />
              Current plan
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-3 px-8 pb-2">
          {PLAN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-[15px]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#22345A] text-[#7BE0A0]">
                <Check className="h-3 w-3" />
              </span>
              <span className="text-[#DCE3F0]">{feature}</span>
            </li>
          ))}
        </ul>

        {planAction && (
          <div className="p-8 pt-6">
            <Button
              type="button"
              disabled={busy}
              onClick={planAction.run}
              className="h-auto w-full rounded-[10px] py-3.5 text-[15px] font-bold sm:w-auto sm:px-8"
            >
              {planAction.label}
            </Button>
          </div>
        )}
      </article>

      {(checkout.isError || portal.isError) && (
        <p className="text-sm text-destructive">
          Something went wrong talking to Stripe. Please try again.
        </p>
      )}
    </div>
  );
}
