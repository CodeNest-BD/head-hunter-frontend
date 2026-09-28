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
  useRecruiterPricing,
  useUpdateRecruiterPricing,
} from "../hooks/useAdmin";

const MIN_MAJOR = 0.5;

export function RecruiterPricingCard() {
  const { data, isPending, isError, refetch } = useRecruiterPricing();
  const update = useUpdateRecruiterPricing();

  const [value, setValue] = useState("");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (data && !seeded) {
      setValue(minorToMajorInput(data.amountMinor));
      setSeeded(true);
    }
  }, [data, seeded]);

  const parsed = Number(value);
  const valid = Number.isFinite(parsed) && parsed >= MIN_MAJOR;

  const onSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!valid) return;
    update.mutate(majorToMinor(parsed));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recruiter subscription price</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="h-24 animate-pulse rounded-sm bg-surface-sunken" />
        ) : isError ? (
          <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg p-3.5 text-sub text-bad">
            <span className="flex items-center gap-2.5 font-[550]">
              <AlertCircle className="size-[15px] shrink-0" />
              Could not load the current price.
            </span>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <p className="text-sub text-ink-muted">
              Current monthly price:{" "}
              <span className="font-[650] tabular-nums text-ink">
                {data.amountMinor !== null
                  ? formatMinor(data.amountMinor)
                  : "Not set"}
              </span>
              {data.priceId && (
                <span className="ml-2 text-meta text-ink-faint">
                  ({data.priceId})
                </span>
              )}
            </p>

            {/* `.field` — label, control, then the consequence of changing it. */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recruiter-price">Monthly price (USD)</Label>
              <div className="flex items-center gap-2">
                <span className="text-body text-ink-muted">$</span>
                <Input
                  id="recruiter-price"
                  type="number"
                  min={MIN_MAJOR}
                  step="0.01"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className="max-w-[160px] tabular-nums"
                />
              </div>
              <p className="text-meta text-ink-faint">
                New subscriptions bill at this rate. Existing subscribers keep
                their current price until they resubscribe.
              </p>
            </div>

            {update.isError && (
              <p className="text-meta font-medium text-bad">
                Could not update the price. Please try again.
              </p>
            )}
            {update.isSuccess && !update.isPending && (
              <p className="text-meta font-medium text-ok">Price updated.</p>
            )}

            <div>
              <Button type="submit" disabled={!valid || update.isPending}>
                {update.isPending ? "Saving…" : "Save price"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
