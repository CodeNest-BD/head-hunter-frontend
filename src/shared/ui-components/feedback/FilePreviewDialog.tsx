"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, X } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { formatSize } from "@/shared/utils/formatSize";

interface FilePreviewDialogProps {
  /** Signed link with no content disposition — renders inline in the frame. */
  previewUrl: string;
  /** Signed link with an attachment disposition — saves instead of rendering. */
  downloadUrl: string;
  fileName: string;
  sizeBytes?: number | null;
  /** The clickable element that opens the preview. */
  children: ReactNode;
}

/**
 * Reads a file without leaving the page: the document renders in an iframe over
 * a blurred backdrop, with a download beside it.
 *
 * The frame is mounted only while open, so closing stops the fetch and a
 * presigned URL is never requested for a file nobody looks at. Rendering is the
 * browser's own PDF viewer rather than a bundled one — no extra dependency, and
 * it inherits the viewer the user already knows.
 */
export function FilePreviewDialog({
  previewUrl,
  downloadUrl,
  fileName,
  sizeBytes,
  children,
}: FilePreviewDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[calc(100vh-4rem)] w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-md border border-border bg-card shadow-card-lg focus:outline-none">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <Dialog.Title className="truncate font-heading text-sm font-extrabold text-foreground">
                {fileName}
              </Dialog.Title>
              {typeof sizeBytes === "number" && (
                <Dialog.Description className="text-xs tabular-nums text-muted-foreground">
                  {formatSize(sizeBytes)}
                </Dialog.Description>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild type="button" variant="outline" size="sm">
                <a href={downloadUrl}>
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {open && (
            <iframe
              src={previewUrl}
              title={fileName}
              className="h-full w-full flex-1 border-0 bg-muted"
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
