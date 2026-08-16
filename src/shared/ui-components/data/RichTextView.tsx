"use client";

import { useMemo } from "react";

import { cn } from "@/shared/libs/shadCnConfig";
import { isPlainText, sanitizeRichText } from "@/shared/libs/richText";

interface RichTextViewProps {
  value: string;
  className?: string;
}

/**
 * Renders a job description. Rich values are sanitized through the shared
 * allow-list before touching the DOM; descriptions that predate the editor
 * (no markup at all) render as pre-wrapped plain text so they neither gain
 * fake markup nor double-escape.
 */
export function RichTextView({ value, className }: RichTextViewProps) {
  const html = useMemo(
    () => (isPlainText(value) ? null : sanitizeRichText(value)),
    [value],
  );

  if (html === null) {
    return (
      <p
        className={cn(
          "whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground",
          className,
        )}
      >
        {value}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-muted-foreground",
        "prose-headings:font-heading prose-headings:text-foreground",
        "prose-a:text-primary prose-strong:text-foreground",
        className,
      )}
      // Safe: `html` has just passed sanitizeRichText's allow-list.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
