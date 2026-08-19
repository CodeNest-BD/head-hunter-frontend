"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface CheckoutResultBannerProps {
  /** Query param written by the Stripe redirect URLs, e.g. "topup". */
  param: string;
  successMessage: string;
  cancelMessage: string;
  /** Fired once when the redirect result is read (before the URL is cleaned),
   * so the page can e.g. start polling for the webhook-driven balance update. */
  onResult?: (result: "success" | "canceled") => void;
}

/**
 * Reads the ?param=success|canceled flag Stripe redirects back with and shows
 * a one-time banner. Read from location in an effect (not useSearchParams) so
 * the page stays statically renderable; the URL is then cleaned so a refresh
 * doesn't re-announce it.
 */
export function CheckoutResultBanner({
  param,
  successMessage,
  cancelMessage,
  onResult,
}: CheckoutResultBannerProps) {
  const [result, setResult] = useState<"success" | "canceled" | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const value = url.searchParams.get(param);
    if (value === "success" || value === "canceled") {
      setResult(value);
      onResult?.(value);
      url.searchParams.delete(param);
      window.history.replaceState(null, "", url.toString());
    }
  }, [param, onResult]);

  if (!result) return null;

  const isSuccess = result === "success";
  return (
    <div
      role="status"
      className={
        "flex items-start gap-3 rounded-md border px-4 py-3 text-sm " +
        (isSuccess
          ? "border-[#CDE7D8] bg-[#E7F4EC] text-[#17734E]"
          : "border-[#F0D4D4] bg-[#FBEAEA] text-[#9B3535]")
      }
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      ) : (
        <XCircle className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      )}
      <p>{isSuccess ? successMessage : cancelMessage}</p>
    </div>
  );
}
