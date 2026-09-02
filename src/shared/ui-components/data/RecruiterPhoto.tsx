"use client";

import { useEffect, useState } from "react";

import { cn } from "@/shared/libs/shadCnConfig";

import { monogram } from "./monogram";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Public URL of a recruiter's profile photo. Points at the backend redirect
 * endpoint (302 → a short-lived signed S3 link), not S3 directly, so the URL is
 * stable and cacheable while the object stays private. Mirrors `companyLogoUrl`.
 */
export function recruiterPhotoUrl(
  recruiterProfileId: string,
  version?: string | number,
): string {
  const url = `${API_BASE}/recruiter-profiles/${recruiterProfileId}/photo`;
  return version === undefined ? url : `${url}?v=${version}`;
}

const SIZE_CLASSES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-xl",
} as const;

export type RecruiterPhotoSize = keyof typeof SIZE_CLASSES;

/**
 * A recruiter's identity chip: their uploaded photo when one exists, otherwise a
 * monogram of their name. The monogram is also the fallback if the image fails
 * to load, so a broken photo never leaves an empty circle. One component so
 * every surface renders recruiter identity the same way.
 */
export function RecruiterPhoto({
  recruiterProfileId,
  hasPhoto,
  name,
  size = "sm",
  version,
  className,
}: {
  recruiterProfileId: string;
  hasPhoto: boolean;
  name: string;
  size?: RecruiterPhotoSize;
  /** Bump to force a reload after the owner changes their own photo. */
  version?: string | number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [recruiterProfileId, version, hasPhoto]);
  const showImage = hasPhoto && !failed && recruiterProfileId !== "";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-extrabold text-primary",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {showImage ? (
        // Plain <img>, not next/image: the src 302-redirects to an expiring
        // signed URL the optimizer can neither cache nor match to a host.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recruiterPhotoUrl(recruiterProfileId, version)}
          alt={`${name} photo`}
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
