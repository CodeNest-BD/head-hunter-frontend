"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldAlert } from "lucide-react";

import { useAuth } from "@/features/auth";
import { disputePath } from "@/shared/utils/entityPaths";
import { formatMinor } from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { Label } from "@/shared/ui-components/controls/label";
import { NativeSelect } from "@/shared/ui-components/controls/nativeSelect";
import { Tile } from "@/shared/ui-components/list/Tile";

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
    // The reference's calm banner card: an amber tile, the offer, and the
    // action pushed to the right edge. A dispute is an escrow safety valve,
    // not an alarm.
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Tile icon={ShieldAlert} tone="warn" />
          <div className="min-w-0">
            <p className="text-block font-[650] text-ink">
              Something wrong with a placement?
            </p>
            <p className="mt-[2px] text-sub text-ink-muted">
              Open a dispute on a fee held in escrow and support will step in.
            </p>
          </div>
          <Button
            type="button"
            className="ml-auto"
            onClick={() => setOpen(true)}
          >
            <Plus /> Raise a Dispute
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selected = options.find((o) => o.placementId === placementId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raise a Dispute</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => {
            setOpen(false);
            setPlacementId("");
          }}
        >
          Close
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isPending ? (
          /* The `.field` this resolves into: its label over the select. */
          <div aria-hidden="true" className="flex max-w-lg flex-col gap-1.5">
            <div className="h-4 w-32 animate-pulse rounded-xs bg-surface-sunken" />
            <div className="h-9 w-full animate-pulse rounded-sm bg-surface-sunken" />
          </div>
        ) : options.length === 0 ? (
          <p className="rounded-sm border border-dashed border-line-strong bg-surface-sub px-3 py-2.5 text-sub text-ink-muted">
            You have no placements held in escrow right now, so there is nothing
            to dispute. A placement appears once an offer is accepted and its
            fee is held.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* `.field` */}
            <div className="flex max-w-lg flex-col gap-1.5">
              <Label htmlFor="dispute-placement">Which placement?</Label>
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
                party={role}
                onCancel={() => setPlacementId("")}
                onRaised={(dispute) => router.push(disputePath(dispute))}
              />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
