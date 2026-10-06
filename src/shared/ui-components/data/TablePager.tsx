"use client";

import { useId, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";
import { Button } from "@/shared/ui-components/controls/button";
import { Input } from "@/shared/ui-components/controls/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui-components/controls/select";

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100] as const;

/**
 * Above this many pages the window stops being a way to get anywhere and the
 * jump box appears beside it.
 *
 * The window shows at most the first four pages and the last four. That is the
 * whole list at eight pages, and a rounding error at eight hundred — at which
 * point reaching the middle means clicking Next some hundreds of times.
 */
const JUMP_THRESHOLD = 10;

interface TablePagerProps {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
  /** Rows per page — drives the "1–10 of N" range readout. */
  pageSize: number;
  /** When provided, renders the rows-per-page selector. */
  onPageSize?: (size: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
}

/**
 * Build the page-button list with ellipses, e.g. [1,2,3,4,"…",51]. Always
 * keeps the first and last page, plus a window around the current page.
 */
function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const out: (number | "…")[] = [1];
  let start = Math.max(2, page - 1);
  let end = Math.min(totalPages - 1, page + 1);
  if (page <= 3) end = 4;
  if (page >= totalPages - 2) start = totalPages - 3;
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p += 1) out.push(p);
  if (end < totalPages - 1) out.push("…");
  out.push(totalPages);
  return out;
}

/**
 * fh-core's `Pagination`: the rows-per-page selector and a "1–10 of N" range on
 * the left, with a windowed run of 32px page buttons and prev/next chevrons on
 * the right.
 *
 * It sits BELOW the table card, on the canvas, not inside the card's footer —
 * the table card holds the data, and moving through it is a separate control.
 *
 * Two shapes, one control. Below `sm` the numbered window is replaced by a
 * plain "Page 3 of 85" between the arrows: seven buttons, two arrows and the
 * jump box do not fit a phone, and wrapping them leaves a ragged stack. The
 * arrows and the jump box are rendered ONCE and shared by both shapes, so no
 * tap target exists twice in the accessibility tree.
 */
export function TablePager({
  page,
  totalPages,
  total,
  onPage,
  pageSize,
  onPageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className,
}: TablePagerProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const jumpId = useId();

  // What has been typed into the jump box, kept apart from `page` so a
  // half-typed "1" does not navigate to page 1 on its way to 15.
  const [draft, setDraft] = useState("");

  const jump = (): void => {
    const wanted = Number.parseInt(draft, 10);
    setDraft("");
    // Clamped rather than rejected: someone typing 9999 into an 85-page list
    // means "the end", and refusing them is a worse answer than taking them
    // there.
    if (Number.isNaN(wanted)) return;
    const next = Math.min(Math.max(wanted, 1), safeTotalPages);
    if (next !== page) onPage(next);
  };

  return (
    <div
      className={cn(
        // items-stretch so each group owns a full-width row and can centre
        // itself in it; centred rows read as one control, where a mix of
        // centred and right-aligned rows reads as two loose pieces.
        "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-2 text-[13px] text-ink-muted sm:justify-start">
        {onPageSize && (
          <Select
            value={String(pageSize)}
            onValueChange={(next) => onPageSize(Number.parseInt(next, 10))}
          >
            <SelectTrigger
              className="h-8 w-20 text-[13px]"
              aria-label="Rows per page"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {/* Grouped digits: "1,041–1,045 of 1,045" is read at a glance, where
            "10411045 of 1045" has to be counted. `tabular-nums` keeps the
            figures from jittering as pages change. */}
        <span className="whitespace-nowrap tabular-nums">
          {first.toLocaleString()}–{last.toLocaleString()} of{" "}
          {total.toLocaleString()}
        </span>
      </div>

      {/* Two groups, not one row of controls: the jump is a separate way of
          moving through the list, and butting it against the Previous arrow
          made it read as another pager button. `gap-x-3` between the groups
          against `gap-1` within the pager is what draws that line. */}
      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-end"
      >
        {safeTotalPages > JUMP_THRESHOLD && (
          // The only way to reach the middle of a long list. Enter commits;
          // typing alone never navigates, so the table is not refetched once
          // per keystroke.
          <span className="flex items-center gap-1.5 text-[13px] text-ink-muted">
            <label htmlFor={jumpId} className="whitespace-nowrap">
              Go to page
            </label>
            <Input
              id={jumpId}
              type="text"
              inputMode="numeric"
              value={draft}
              // Grouped like the buttons beside it, so the hint and the labels
              // do not disagree about what page 1,045 is called.
              placeholder={page.toLocaleString()}
              onChange={(event) =>
                setDraft(event.target.value.replace(/[^0-9]/g, ""))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  jump();
                }
              }}
              onBlur={() => setDraft("")}
              aria-label={`Go to page, 1 to ${safeTotalPages}`}
              className="h-8 w-[4.5rem] px-2 text-center text-[13px] tabular-nums"
            />
          </span>
        )}

        <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {/* The phone's whole pager: which page this is, and how many there
              are. It says what the numbered window says, in the room a phone
              actually has. */}
          <span className="whitespace-nowrap px-2 text-[13px] tabular-nums text-ink-muted sm:hidden">
            Page {page.toLocaleString()} of {safeTotalPages.toLocaleString()}
          </span>

          {pageWindow(page, safeTotalPages).map((entry, index) =>
            entry === "…" ? (
              <span
                key={`gap-${index}`}
                aria-hidden="true"
                className="hidden px-1.5 text-[13px] text-ink-faint sm:inline"
              >
                …
              </span>
            ) : (
              <Button
                key={entry}
                type="button"
                variant={entry === page ? "default" : "outline"}
                // `min-w-8` keeps a single digit square, like the arrows either
                // side of it; `px-2` gives four digits the room they need
                // instead of overflowing a fixed width.
                className="hidden h-8 min-w-8 px-2 text-[13px] font-[550] tabular-nums sm:inline-flex"
                aria-label={`Page ${entry}`}
                aria-current={entry === page ? "page" : undefined}
                onClick={() => onPage(entry)}
              >
                {entry.toLocaleString()}
              </Button>
            ),
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Next page"
            disabled={page >= safeTotalPages}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </nav>
    </div>
  );
}
