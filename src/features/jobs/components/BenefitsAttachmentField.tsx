"use client";

import { useRef } from "react";
import { FileText, X } from "lucide-react";

import {
  DOCUMENT_ACCEPT,
  DOCUMENT_CONTENT_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_MB,
} from "@/shared/libs/documentUpload";
import { Button } from "@/shared/ui-components/controls/button";
import { formatSize } from "@/shared/utils/formatSize";
import type { BenefitsAttachment } from "../schemas";

/**
 * What the field is holding. A union rather than a file plus flags: "saved"
 * and "selected" carry different payloads and can never be true at once.
 */
export type BenefitsDocumentState =
  | { status: "empty" }
  | { status: "saved"; attachment: BenefitsAttachment }
  | { status: "selected"; file: File };

/** null when the file is acceptable; otherwise the reason to show the user. */
export function benefitsDocumentError(file: File): string | null {
  if (!DOCUMENT_CONTENT_TYPES.some((type) => type === file.type)) {
    return "Attach a PDF or Word document (.pdf, .doc, .docx)";
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return `The document must be ${MAX_DOCUMENT_MB}MB or smaller`;
  }
  return null;
}

interface BenefitsAttachmentFieldProps {
  value: BenefitsDocumentState;
  onChange: (next: BenefitsDocumentState) => void;
  /**
   * False on the admin edit screen, which saves through the admin endpoint and
   * cannot presign an upload against a company's job. The stored document
   * still shows, and can still be removed.
   */
  canAttach?: boolean;
  error?: string | null;
}

/**
 * The benefits document: one attachment, alongside the summary textarea rather
 * than instead of it — a company may type a summary, attach a document, or do
 * both. A file chosen here uploads once the job has been saved, since the
 * object key is scoped to the job.
 */
export function BenefitsAttachmentField({
  value,
  onChange,
  canAttach = true,
  error,
}: BenefitsAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const named =
    value.status === "saved"
      ? { name: value.attachment.fileName, bytes: value.attachment.sizeBytes }
      : value.status === "selected"
        ? { name: value.file.name, bytes: value.file.size }
        : null;

  const clear = () => {
    onChange({ status: "empty" });
    // The same file cannot be re-picked while the input still holds it.
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id="benefitsAttachment"
        type="file"
        accept={DOCUMENT_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange({ status: "selected", file });
        }}
      />
      {named ? (
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-secondary/40 px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-sm text-navy">
            {named.name}
          </span>
          {named.bytes !== undefined && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatSize(named.bytes)}
            </span>
          )}
          {value.status === "selected" && (
            <span className="shrink-0 text-xs text-muted-foreground">
              Uploads when you save
            </span>
          )}
          <button
            type="button"
            aria-label="Remove the benefits document"
            onClick={clear}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        canAttach && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => inputRef.current?.click()}
          >
            Add Attachment
          </Button>
        )
      )}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        canAttach && (
          <p className="text-xs text-muted-foreground">
            PDF or Word, up to {MAX_DOCUMENT_MB}MB.
          </p>
        )
      )}
    </div>
  );
}
