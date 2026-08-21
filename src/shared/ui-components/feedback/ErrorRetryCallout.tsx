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
    <div className="flex max-w-md flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="h-[18px] w-[18px]" />
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
