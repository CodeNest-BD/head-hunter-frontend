import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge resolves conflicts by matching a class against the scales it
 * knows. Our design system adds named font sizes (`text-sub`, `text-block`, …)
 * and a named radius (`rounded-xs`), which it has never heard of — so it files
 * `text-sub` under *text color* and lets it cancel a real color like
 * `text-white`. That silently stripped the label color off every button whose
 * size variant carried a type role.
 *
 * Teaching it the two extra scales makes a role and a color independent again.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "label",
            "meta",
            "sub",
            "body",
            "block",
            "card",
            "section",
            "page",
            "stat",
            "display",
          ],
        },
      ],
      rounded: [{ rounded: ["xs"] }],
    },
  },
});

/** Merge conditional class names, with later Tailwind utilities winning. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
