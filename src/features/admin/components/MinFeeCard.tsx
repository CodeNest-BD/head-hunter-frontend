"use client";

import { useEffect, useState } from "react";

import {
  formatMinor,
  majorToMinor,
  minorToMajorInput,
} from "@/shared/utils/money";
import { Button } from "@/shared/ui-components/controls/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui-components/controls/card";
import { Input } from "@/shared/ui-components/controls/input";
import { Label } from "@/shared/ui-components/controls/label";
import { Alert } from "@/shared/ui-components/feedback/Alert";
import {
  useMinRecruiterFeeSetting,
  useUpdateMinRecruiterFee,
} from "../hooks/useAdmin";

/** The floor a company must offer to publish a job. */
export function MinFeeCard() {
  const { data, isPending, isError, refetch } = useMinRecruiterFeeSetting();
  const update = useUpdateMinRecruiterFee();

  const [value, setValue] = useState("");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (data && !seeded) {
      setValue(minorToMajorInput(data.amountMinor));
      setSeeded(true);
    }
  }, [data, seeded]);

  const parsed = Number(value);
  const valid = Number.isFinite(parsed) && parsed >= 0;

  const onSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!valid) return;
    update.mutate(majorToMinor(parsed));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minimum recruiter fee</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="h-24 animate-pulse rounded-sm bg-surface-sunken" />
        ) : isError ? (
          <Alert tone="bad">
            <div className="flex flex-col items-start gap-2.5">
              Could not load the current minimum.
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          </Alert>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <p className="text-sub text-ink-body">
              Companies cannot publish a job offering less than{" "}
              <span className="font-[650] tabular-nums text-ink">
                {formatMinor(data.amountMinor)}
              </span>
              . Already-published jobs are unaffected by changes.
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="min-recruiter-fee">Minimum fee (USD)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sub text-ink-muted">$</span>
                <Input
                  id="min-recruiter-fee"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className="max-w-[160px] tabular-nums"
                />
              </div>
            </div>

            <div>
              <Button type="submit" disabled={!valid || update.isPending}>
                {update.isPending ? "Saving…" : "Save minimum"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
