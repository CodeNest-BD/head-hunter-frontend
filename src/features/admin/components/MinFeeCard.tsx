"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

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
        <CardTitle className="text-base">Minimum recruiter fee</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted/40" />
        ) : isError ? (
          <div className="flex flex-col items-start gap-3 text-sm text-destructive">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Could not load the current minimum.
            </span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Companies cannot publish a job offering less than{" "}
              <span className="font-semibold text-navy">
                {formatMinor(data.amountMinor)}
              </span>
              . Already-published jobs are unaffected by changes.
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="min-recruiter-fee">Minimum fee (USD)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="min-recruiter-fee"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className="max-w-[160px]"
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
