"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui-components/controls/button";
import { ImageCropDialog } from "./ImageCropDialog";

/** Kept in step with the backend's accepted types / max size. */
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");

interface ImageUploaderProps {
  /** Renders the current image; `version` bumps after a change to bust the
   * browser cache on an otherwise-stable image URL. */
  renderPreview: (version: number) => ReactNode;
  /** Whether an image is already set (drives Replace vs Upload + the Remove button). */
  hasImage: boolean;
  /** Noun shown in the buttons and editor, e.g. "logo" or "photo". */
  label: string;
  /** Helper line under the buttons. */
  helpText: string;
  /** True while the owning mutations run. */
  isBusy: boolean;
  /** Uploads the edited file; resolves on success (so the preview can refresh). */
  upload: (file: File) => Promise<unknown>;
  onRemove: () => void;
}

/**
 * The shared image control behind the company logo and the recruiter photo:
 * pick → crop/rotate in {@link ImageCropDialog} → upload immediately (not on a
 * form Save, the standard behaviour for an avatar). Validation mirrors the API
 * so a too-big or wrong-type file is refused before a wasted round-trip. Both
 * callers wrap it, so the two behave identically by construction.
 */
export function ImageUploader({
  renderPreview,
  hasImage,
  label,
  helpText,
  isBusy,
  upload,
  onRemove,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Bumped after each change so the owner sees their new image immediately,
  // past the browser cache on the otherwise-stable image URL.
  const [version, setVersion] = useState(0);
  // Object URL of the file being edited; drives the editor dialog. Revoked when
  // the editor closes so the picked file's memory is released.
  const [editSrc, setEditSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = isBusy || saving;

  useEffect(() => {
    if (!editSrc) return;
    return () => URL.revokeObjectURL(editSrc);
  }, [editSrc]);

  const closeEditor = () => setEditSrc(null);

  // A picked file goes to the editor first — crop/rotate — not straight to S3.
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
    setEditSrc(URL.createObjectURL(file));
  };

  const onSaveEdited = async (file: File) => {
    setSaving(true);
    try {
      await upload(file);
      setVersion((v) => v + 1);
      closeEditor();
    } catch {
      // The upload hook surfaces its own error toast; nothing to add here.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {renderPreview(version)}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="capitalize"
          >
            <ImageUp className="h-4 w-4" />
            {hasImage ? `Replace ${label}` : `Upload ${label}`}
          </Button>
          {hasImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-[13px] text-muted-foreground">
          {busy ? "Uploading…" : helpText}
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
      <ImageCropDialog
        imageSrc={editSrc}
        label={label}
        isSaving={saving}
        onCancel={closeEditor}
        onSave={onSaveEdited}
      />
    </div>
  );
}
