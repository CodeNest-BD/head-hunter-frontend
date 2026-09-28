"use client";

import { useRef } from "react";
import { FileText, X } from "lucide-react";

import { Button } from "@/shared/ui-components/controls/button";
import { Tile } from "@/shared/ui-components/list/Tile";
import { formatSize } from "@/shared/utils/formatSize";

/** Wider than `DOCUMENT_ACCEPT`: proof is whatever the party actually has — a
 * screenshot of a chat as often as a signed PDF. Mirrors the backend's
 * DISPUTE_PROOF_CONTENT_TYPES. */
export const PROOF_ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp";

const PROOF_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

const MAX_PROOF_BYTES = 10 * 1024 * 1024;
const MAX_PROOF_MB = Math.floor(MAX_PROOF_BYTES / (1024 * 1024));
export const MAX_PROOF_FILES = 10;

/** null when the file is acceptable; otherwise the reason to show the user. */
export function proofFileError(file: File): string | null {
  if (!PROOF_CONTENT_TYPES.some((type) => type === file.type)) {
    return "Attach a PDF, Word document or image (.pdf, .doc, .docx, .png, .jpg, .webp)";
  }
  if (file.size > MAX_PROOF_BYTES) {
    return `Each file must be ${MAX_PROOF_MB}MB or smaller`;
  }
  return null;
}

/**
 * The documents filed with a dispute, picked before it exists and uploaded as
 * it is opened. Several files rather than one — proof is usually a thread, an
 * invoice and a screenshot, not a single document — which is why this is its
 * own field and not `BenefitsAttachmentField`'s single-file union.
 */
export function DisputeProofField({
  files,
  onChange,
  error,
  disabled,
}: {
  files: File[];
  onChange: (next: File[]) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (picked: FileList): void => {
    onChange([...files, ...Array.from(picked)].slice(0, MAX_PROOF_FILES));
    // The same file cannot be re-picked while the input still holds it.
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    // `.well` — the picked files and their control read as one framed field
    // rather than as loose rows against the form's surface.
    <div className="flex flex-col gap-2.5 rounded-sm border border-line bg-surface-sub px-3 py-2.5">
      <input
        ref={inputRef}
        id="dispute-proof"
        type="file"
        multiple
        accept={PROOF_ACCEPT}
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) add(event.target.files);
        }}
      />

      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}`}
              className="flex items-center gap-2.5 rounded-sm border border-line bg-surface px-2.5 py-2"
            >
              <Tile icon={FileText} tone="neutral" className="size-7" />
              <span className="min-w-0 flex-1 truncate text-sub font-[550] text-ink">
                {file.name}
              </span>
              <span className="shrink-0 tabular-nums text-meta text-ink-faint">
                {formatSize(file.size)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => onChange(files.filter((_, at) => at !== index))}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-xs text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-50"
              >
                <X className="size-[15px]" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled || files.length >= MAX_PROOF_FILES}
        onClick={() => inputRef.current?.click()}
      >
        Upload Proof
      </Button>

      {error ? (
        <p className="text-meta font-medium text-bad">{error}</p>
      ) : (
        <p className="text-meta text-ink-faint">
          Attach anything that backs up your side — up to {MAX_PROOF_FILES}{" "}
          files, {MAX_PROOF_MB}MB each. The admin reviewing this sees them.
        </p>
      )}
    </div>
  );
}
