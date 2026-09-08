"use client";

import { Button } from "@/shared/ui-components/controls/button";

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
