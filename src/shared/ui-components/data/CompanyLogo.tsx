"use client";

import { useEffect, useState } from "react";

import { cn } from "@/shared/libs/shadCnConfig";

import { monogram } from "./monogram";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Public URL of a company's logo. It points at the backend redirect endpoint
 * (302 → a short-lived signed S3 link), not at S3 directly, so the URL is
 * stable and browser-cacheable while the object stays private. Guests hit it
 * too, so no auth is attached.
 */
export function companyLogoUrl(
  companyProfileId: string,
  version?: string | number,
): string {
  const url = `${API_BASE}/company-profiles/${companyProfileId}/logo`;
  // A stable URL is cacheable, but the owner needs to see a just-uploaded logo
  // immediately; a version bumped on each change busts the cache only for them.
  return version === undefined ? url : `${url}?v=${version}`;
}

const SIZE_CLASSES = {
  xs: "h-7 w-7 text-[10px] rounded",
  sm: "h-9 w-9 text-xs rounded-md",
  md: "h-12 w-12 text-sm rounded-md",
  lg: "h-16 w-16 text-lg rounded-lg",
  xl: "h-20 w-20 text-xl rounded-lg",
} as const;

export type CompanyLogoSize = keyof typeof SIZE_CLASSES;

/**
 * A company's identity chip, shown everywhere a company appears: its logo when
 * one is uploaded, otherwise a monogram of its name. The monogram is also the
 * fallback if the image ever fails to load, so a broken logo never leaves an
 * empty box. One component so every surface renders company identity the same
 * way — swap the logo source once, and it changes everywhere.
 */
export function CompanyLogo({
  companyProfileId,
  hasLogo,
  name,
  size = "sm",
  version,
  className,
}: {
  companyProfileId: string;
  hasLogo: boolean;
  name: string;
  size?: CompanyLogoSize;
  /** Bump to force a reload after the owner changes their own logo. */
  version?: string | number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // A new logo (or company) deserves a fresh attempt, even if the last failed.
  useEffect(() => setFailed(false), [companyProfileId, version, hasLogo]);
  const showImage = hasLogo && !failed && companyProfileId !== "";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-accent font-extrabold text-primary",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {showImage ? (
        // Plain <img>, not next/image: the src 302-redirects to an expiring
        // signed URL, which the image optimizer can neither cache nor match to
        // a configured host — and per-environment domain config buys nothing
        // for a chip this small.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={companyLogoUrl(companyProfileId, version)}
          alt={`${name} logo`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{monogram(name)}</span>
      )}
    </span>
  );
}
