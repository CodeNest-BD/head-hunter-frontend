"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type ChevronProps } from "react-day-picker";
import { cn } from "@/shared/libs/shadCnConfig";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const navButtonClassName = cn(
  buttonVariants({ variant: "ghost", size: "icon" }),
  "size-7 text-ink-muted hover:text-ink disabled:opacity-40",
);

/** react-day-picker renders one `Chevron` for both nav directions, so the
 * icon is chosen from `orientation` rather than by overriding two components. */
function CalendarChevron({ orientation, className }: ChevronProps) {
  const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
  return <Icon className={cn("h-4 w-4", className)} aria-hidden="true" />;
}

/**
 * The app's month-grid date picker — a themed `DayPicker` wired to the same
 * shadcn tokens (`primary`, `accent`, `muted-foreground`) every other control
 * uses, so a date field looks native to the design system without each caller
 * restating a class map.
 *
 * `classNames` is merged last: a caller can restyle one part (a wider grid,
 * a different selected colour) without losing the rest of the theme.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-3",
        month_caption: "flex h-7 items-center justify-center",
        caption_label: "text-sub font-semibold text-ink",
        nav: "absolute inset-x-1 top-0 flex items-center justify-between",
        button_previous: navButtonClassName,
        button_next: navButtonClassName,
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-8 text-[10.5px] font-[650] uppercase tracking-[0.07em] text-ink-muted",
        week: "mt-1 flex w-full",
        day: "size-8 p-0 text-center text-sub",
        // The selected/today state lands on the grid cell, so the visual
        // treatment is pushed down onto the button it wraps.
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 rounded-xs p-0 text-sub font-medium text-ink tabular-nums",
        ),
        selected:
          "[&>button]:bg-blue [&>button]:text-white [&>button]:hover:bg-blue-deep",
        // Underlined rather than recoloured: a colour here would fight
        // `selected`'s foreground on the day that is both.
        today:
          "[&>button]:font-semibold [&>button]:underline [&>button]:decoration-primary [&>button]:decoration-2 [&>button]:underline-offset-4",
        outside: "[&>button]:font-normal [&>button]:text-ink-faint",
        // Weight and colour as well as opacity: opacity alone left disabled
        // days reading almost the same as pickable ones.
        disabled:
          "[&>button]:pointer-events-none [&>button]:font-normal [&>button]:text-ink-faint [&>button]:opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{ Chevron: CalendarChevron }}
      {...props}
    />
  );
}
