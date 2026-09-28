import { AlertCircle } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";

interface ErrorRetryCalloutProps {
  message: string;
  onRetry: () => void;
}

/**
 * The icon + message + Retry pairing used across the app's data-fetch error
 * states (first established on /recruiter/profile) — pulled out so more than
 * one screen can show it without re-typing the same markup.
 */
export function ErrorRetryCallout({
  message,
  onRetry,
}: ErrorRetryCalloutProps) {
  return (
    <div className="flex max-w-md flex-col gap-3 rounded-sm border border-bad-line bg-bad-bg px-3.5 py-[11px] text-sub text-bad">
      <div className="flex items-center gap-2.5 font-[550]">
        <AlertCircle className="size-[15px] shrink-0" />
        {message}
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}
