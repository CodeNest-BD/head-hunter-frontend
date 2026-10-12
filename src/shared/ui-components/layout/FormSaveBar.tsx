"use client";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";

/**
 * The reference's `.savebar`: a translucent, blurred strip that sticks to the
 * viewport bottom while its form is in view, the form's state read out on the
 * left and its actions pushed to the right edge. Save is always reachable, so
 * a long form never hides its own button past the fold.
 *
 * One bar for every editable form in the app — the dot and the wording are how
 * a page says whether there is anything to save.
 */
export function FormSaveBar({
  isDirty,
  isSaving,
  onDiscard,
}: {
  isDirty: boolean;
  isSaving: boolean;
  onDiscard: () => void;
}) {
  return (
    <div className="sticky bottom-3 z-20 flex items-center gap-2.5 rounded-md border border-line bg-surface/90 px-3.5 py-2.5 shadow-pop backdrop-blur-[6px]">
      <span className="flex items-center gap-[7px] text-[12.5px] text-ink-muted">
        <span
          aria-hidden="true"
          className={cn(
            "size-2 shrink-0 rounded-full",
            isDirty ? "bg-pending" : "bg-ok",
          )}
        />
        {isDirty ? "Unsaved changes" : "All changes saved"}
      </span>
      <div className="ml-auto flex gap-2">
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
