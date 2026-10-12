import type { ReactNode } from "react";
import { Download } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { ToolbarSelect } from "@/shared/ui-components/data/ListToolbar";
import { DATE_RANGE_OPTIONS } from "./financeLabels";

/**
 * The finance boards' page-header controls: the date range the whole board
 * reads under, and an export of exactly what it is showing. `leading` takes a
 * board's own status chip (the payouts board's next run).
 */
export function FinanceHeaderActions({
  withinDays,
  onWithinDays,
  onExport,
  exporting,
  leading,
}: {
  /** "" for all time, else a day count from `DATE_RANGE_OPTIONS`. */
  withinDays: string;
  onWithinDays: (next: string) => void;
  onExport: () => void;
  exporting: boolean;
  leading?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {leading}
      <ToolbarSelect
        label="Date range"
        value={withinDays}
        onChange={onWithinDays}
        allLabel="All time"
        options={DATE_RANGE_OPTIONS}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={exporting}
      >
        <Download />
        {exporting ? "Exporting…" : "Export CSV"}
      </Button>
    </div>
  );
}
