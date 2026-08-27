"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Slider from "@radix-ui/react-slider";
import Cropper, { type Area } from "react-easy-crop";
import { RotateCw, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui-components/controls/button";
import { cropImageToBlob } from "../lib/cropImage";

interface LogoEditorDialogProps {
  /** Object URL of the picked file, or null when the editor is closed. */
  imageSrc: string | null;
  isSaving: boolean;
  onCancel: () => void;
  /** Receives the cropped, rotated, re-encoded square image ready to upload. */
  onSave: (file: File) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/** A thin wrapper over the Radix slider, styled to match the app. */
function ControlSlider({
  value,
  min,
  max,
  step,
  onValueChange,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  ariaLabel: string;
}) {
  return (
    <Slider.Root
      className="relative flex h-5 w-full flex-1 touch-none select-none items-center"
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([next]) => onValueChange(next)}
    >
      <Slider.Track className="relative h-1 grow rounded-full bg-border">
        <Slider.Range className="absolute h-full rounded-full bg-primary" />
      </Slider.Track>
      <Slider.Thumb
        aria-label={ariaLabel}
        className="block h-4 w-4 rounded-full border border-primary bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </Slider.Root>
  );
}

/**
 * The logo editor: a square crop viewport with drag-to-reposition, a zoom
 * slider, and rotation, over the just-picked image. On save it exports the
 * visible crop to a 512×512 WebP file and hands it back — the upload itself
 * stays the caller's job, so this component owns only the editing.
 */
export function LogoEditorDialog({
  imageSrc,
  isSaving,
  onCancel,
  onSave,
}: LogoEditorDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [exporting, setExporting] = useState(false);

  const open = imageSrc !== null;
  const busy = isSaving || exporting;

  // Reset the transform each time a fresh image opens, so a previous edit's
  // zoom/rotation never carries over to the next picture.
  const reset = (): void => {
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setRotation(0);
    setCroppedAreaPixels(null);
  };

  const handleSave = async (): Promise<void> => {
    if (!imageSrc || !croppedAreaPixels) return;
    setExporting(true);
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels, rotation);
      onSave(new File([blob], "logo.webp", { type: "image/webp" }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not edit the image",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) {
          reset();
          onCancel();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
        <Dialog.Content
          onOpenAutoFocus={reset}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-x-hidden overflow-y-auto rounded-md border border-border bg-card shadow-card-lg focus:outline-none"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
            <Dialog.Title className="text-sm font-bold text-navy">
              Edit logo
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                disabled={busy}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Square crop stage. react-easy-crop fills its (relative) parent —
           * and is absolutely positioned, so this box has no min-content
           * height of its own. Without `shrink-0` the flex parent collapses it
           * toward zero on a short viewport instead of scrolling. */}
          <div className="relative h-72 w-full shrink-0 bg-navy/90">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                restrictPosition
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_, area) => setCroppedAreaPixels(area)}
              />
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
              <ControlSlider
                ariaLabel="Zoom"
                value={zoom}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                onValueChange={setZoom}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                disabled={busy}
              >
                <RotateCw className="h-4 w-4" />
                Rotate
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  reset();
                  onCancel();
                }}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSave()}
                disabled={busy || !croppedAreaPixels}
              >
                {busy ? "Saving…" : "Save logo"}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
