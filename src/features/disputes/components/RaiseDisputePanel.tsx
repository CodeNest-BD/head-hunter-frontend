"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldAlert } from "lucide-react";

import { useAuth } from "@/features/auth";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import { Card, CardContent } from "@/shared/ui-components/controls/card";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";

import { useEligiblePlacements } from "../hooks/useDisputes";
import { RaiseDisputeForm } from "./RaiseDisputeForm";

/**
 * The self-contained "raise a dispute" entry on the Disputes page: pick one of
 * your placements still held in escrow, then file the reason. This is the entry
 * point independent of the wallet, so a dispute is always one click from the
 * Disputes tab — not only from a placement row.
 */
export function RaiseDisputePanel() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role ?? null;
  const { data: eligible, isPending } = useEligiblePlacements(role);
  const [open, setOpen] = useState(false);
  const [placementId, setPlacementId] = useState("");

  if (role !== "company" && role !== "recruiter") return null;

  const options = eligible ?? [];

  if (!open) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">
                Something wrong with a placement?
              </p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Open a dispute on a fee held in escrow and support will step in.
              </p>
            </div>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Raise a Dispute
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selected = options.find((o) => o.placementId === placementId);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-base font-bold text-navy">
            Raise a Dispute
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              setPlacementId("");
            }}
          >
            Close
          </Button>
        </div>

        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading your placements…</p>
        ) : options.length === 0 ? (
          <p className="rounded-md border border-dashed border-input bg-secondary/40 p-4 text-[13px] text-muted-foreground">
            You have no placements held in escrow right now, so there is nothing
            to dispute. A placement appears once an offer is accepted and its fee
            is held.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="dispute-placement"
                className="text-[13px] font-semibold text-navy"
              >
                Which placement?
              </label>
              <NativeSelect
                id="dispute-placement"
                value={placementId}
                onChange={(e) => setPlacementId(e.target.value)}
              >
                <option value="">Select a placement…</option>
                {options.map((o) => (
                  <option key={o.placementId} value={o.placementId}>
                    {o.label} — {formatMinor(o.amountMinor)}
                  </option>
                ))}
              </NativeSelect>
            </div>

            {selected ? (
              <RaiseDisputeForm
                key={selected.placementId}
                placementId={selected.placementId}
                onCancel={() => setPlacementId("")}
                onRaised={(id) => router.push(`/disputes/${id}`)}
              />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
