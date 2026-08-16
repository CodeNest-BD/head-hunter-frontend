import DOMPurify from "dompurify";

/**
 * The one sanitizer for job-description HTML — applied when the form saves
 * AND when a description renders, so a value that slipped into the database
 * some other way still can't script.
 */
const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "br",
  "blockquote",
];
const ALLOWED_ATTR = ["href", "target", "rel"];

let hooked = false;

/** Every surviving link opens in a new tab and never leaks an opener. */
function ensureLinkHook(): void {
  if (hooked) return;
  hooked = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
}

export function sanitizeRichText(html: string): string {
  ensureLinkHook();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // http(s) and mailto only — no javascript: URLs.
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
  });
}

/** True when a stored description predates the rich editor (plain text). */
export function isPlainText(value: string): boolean {
  return !value.includes("<");
}

/** An editor document with no actual text (e.g. "<p></p>") counts as empty. */
export function isRichTextEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim() === "";
}
