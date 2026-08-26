"use client";

import { useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui-components/controls/button";
import { CompanyLogo } from "@/shared/ui-components/data/CompanyLogo";
import type { CompanyProfile } from "../schemas";
import {
  useRemoveCompanyLogo,
  useUploadCompanyLogo,
} from "../hooks/useCompanyProfile";

/** Kept in step with the backend's LOGO_CONTENT_TYPES / MAX_LOGO_BYTES. */
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");

/**
 * The company's logo control on the profile page. Uploads happen immediately
 * (not on the form's Save), the standard behaviour for an avatar: the caller
 * threads it into the Identity section so a logo sits beside the name it
 * represents. Validation mirrors the API so a too-big or wrong-type file is
 * refused before a wasted round-trip.
 */
export function CompanyLogoUploader({ profile }: { profile: CompanyProfile }) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Bumped after each change so the owner sees their new logo immediately,
  // past the browser cache on the otherwise-stable logo URL.
  const [version, setVersion] = useState(0);
  const upload = useUploadCompanyLogo();
  const remove = useRemoveCompanyLogo();
  const busy = upload.isPending || remove.isPending;

  const onPick = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Use a PNG, JPG, or WebP image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 2 MB or smaller");
      return;
    }
    upload.mutate(file, { onSuccess: () => setVersion((v) => v + 1) });
  };

  return (
    <div className="flex items-center gap-4">
      <CompanyLogo
        companyProfileId={profile.id}
        hasLogo={profile.hasLogo}
        name={profile.companyName}
        size="xl"
        version={version}
      />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImageUp className="h-4 w-4" />
            {profile.hasLogo ? "Replace logo" : "Upload logo"}
          </Button>
          {profile.hasLogo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => remove.mutate()}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-[13px] text-muted-foreground">
          {busy
            ? "Uploading…"
            : "PNG, JPG, or WebP · up to 2 MB · square works best."}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(event) => {
          onPick(event.target.files?.[0]);
          // Reset so re-picking the same file still fires a change.
          event.target.value = "";
        }}
      />
    </div>
  );
}
