"use client";

import type { ReactNode } from "react";

import { Button } from "@/shared/ui-components/controls/button";

/** A form section: title + hint on the left, fields on the right. */
export function CompanyFormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-8 gap-y-4 p-5 sm:p-6 md:grid-cols-[minmax(0,15rem)_1fr]">
      <div>
        <h3 className="text-sm font-bold text-navy">{title}</h3>
        {hint && (
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

/** Sticky save bar so Save is always reachable while editing. */
export function CompanyFormSaveBar({
  isDirty,
  isSaving,
  onDiscard,
}: {
  isDirty: boolean;
  isSaving: boolean;
  onDiscard: () => void;
}) {
  return (
    <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-md border border-border bg-card/95 px-4 py-3 shadow-card-lg backdrop-blur sm:px-5">
      <span className="text-sm text-muted-foreground">
        {isDirty ? "Unsaved changes" : "All changes saved"}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!isDirty || isSaving}
          onClick={onDiscard}
        >
          Discard
        </Button>
        <Button type="submit" size="sm" disabled={isSaving || !isDirty}>
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
