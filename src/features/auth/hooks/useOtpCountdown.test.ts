import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OTP_TTL_MS, markOtpSent, useOtpCountdown } from "./useOtpCountdown";

describe("useOtpCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it("reports no countdown when no code has been sent", () => {
    const { result } = renderHook(() => useOtpCountdown("nobody@example.com"));
    expect(result.current.secondsLeft).toBe(0);
  });

  it("counts down from the full TTL and formats the remainder", () => {
    markOtpSent("user@example.com");
    const { result } = renderHook(() => useOtpCountdown("user@example.com"));

    expect(result.current.label).toBe("5:00");

    act(() => {
      vi.advanceTimersByTime(29_000);
    });
    expect(result.current.label).toBe("4:31");
  });

  // The whole point of persisting the send time: re-entering the screen must
  // not hand back a fresh five minutes for a code that is already half spent.
  it("resumes from the original send time across remounts", () => {
    markOtpSent("user@example.com");
    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000);
    });

    const { result } = renderHook(() => useOtpCountdown("user@example.com"));
    expect(result.current.secondsLeft).toBe(60);
  });

  it("frees the resend once the code has expired", () => {
    markOtpSent("user@example.com");
    const { result } = renderHook(() => useOtpCountdown("user@example.com"));

    act(() => {
      vi.advanceTimersByTime(OTP_TTL_MS);
    });
    expect(result.current.secondsLeft).toBe(0);
  });

  it("tracks each address separately", () => {
    markOtpSent("first@example.com");
    const { result, rerender } = renderHook(
      ({ email }) => useOtpCountdown(email),
      { initialProps: { email: "first@example.com" } },
    );
    expect(result.current.secondsLeft).toBe(300);

    rerender({ email: "second@example.com" });
    expect(result.current.secondsLeft).toBe(0);
  });
});
