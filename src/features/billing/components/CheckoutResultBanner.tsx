"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/shared/ui-components/feedback/Alert";

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
    <Alert tone={isSuccess ? "ok" : "bad"}>
      <p>{isSuccess ? successMessage : cancelMessage}</p>
    </Alert>
  );
}
