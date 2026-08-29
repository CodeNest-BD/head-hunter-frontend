"use client";

import { useCallback, useEffect, useState } from "react";

/** The backend expires an emailed code five minutes after it is issued. */
export const OTP_TTL_MS = 5 * 60 * 1000;

/** "Five minutes", spelled out once so every screen words the rule the same. */
export const OTP_TTL_LABEL = "5 minutes";

// Keyed by address, and in sessionStorage rather than component state, because
// the code is requested on one screen and entered on the next — and a reload
// of the reset screen must not hand the user a fresh five minutes for a code
// that is already half expired.
const storageKey = (email: string): string =>
  `hh:otp-sent-at:${email.trim().toLowerCase()}`;

function readSentAt(email: string): number | null {
  if (!email.trim()) return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(email));
    if (raw === null) return null;
    const sentAt = Number(raw);
    return Number.isFinite(sentAt) ? sentAt : null;
  } catch {
    return null;
  }
}

/**
 * Records that a code was just emailed to `email`, so the screen the user
 * lands on next can count down the code's remaining life.
 */
export function markOtpSent(email: string): void {
  if (!email.trim()) return;
  try {
    window.sessionStorage.setItem(storageKey(email), String(Date.now()));
  } catch {
    // Non-fatal: without storage the countdown simply doesn't gate the resend.
  }
}

function countdownLabel(secondsLeft: number): string {
  const minutes = Math.floor(secondsLeft / 60);
  return `${minutes}:${String(secondsLeft % 60).padStart(2, "0")}`;
}

/**
 * Live countdown to the expiry of the code last emailed to `email`, driving
 * both the "expires in" copy and the resend gate. `secondsLeft` is 0 when no
 * code is outstanding — nothing was sent, or the last one has lapsed — which
 * is exactly when requesting another should be allowed.
 */
export function useOtpCountdown(email: string): {
  secondsLeft: number;
  label: string;
  markSent: () => void;
} {
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Read on the client only, so the server-rendered markup stays deterministic.
  useEffect(() => {
    setSentAt(readSentAt(email));
  }, [email]);

  useEffect(() => {
    if (sentAt === null) {
      setSecondsLeft(0);
      return;
    }
    const tick = (): number => {
      const left = Math.max(
        0,
        Math.ceil((sentAt + OTP_TTL_MS - Date.now()) / 1000),
      );
      setSecondsLeft(left);
      return left;
    };
    if (tick() === 0) return;
    const interval = window.setInterval(() => {
      if (tick() === 0) window.clearInterval(interval);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sentAt]);

  const markSent = useCallback(() => {
    markOtpSent(email);
    setSentAt(Date.now());
  }, [email]);

  return { secondsLeft, label: countdownLabel(secondsLeft), markSent };
}
