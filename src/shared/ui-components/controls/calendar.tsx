"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type ChevronProps } from "react-day-picker";
import { cn } from "@/shared/libs/shadCnConfig";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const navButtonClassName = cn(
  buttonVariants({ variant: "ghost", size: "icon" }),
  "h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-40",
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
        caption_label: "text-sm font-medium text-foreground",
        nav: "absolute inset-x-1 top-0 flex items-center justify-between",
        button_previous: navButtonClassName,
        button_next: navButtonClassName,
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-8 text-[0.7rem] font-normal uppercase text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "h-8 w-8 p-0 text-center text-sm",
        // The selected/today state lands on the grid cell, so the visual
        // treatment is pushed down onto the button it wraps.
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 rounded-md p-0 text-sm font-normal",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        // Underlined rather than recoloured: a colour here would fight
        // `selected`'s foreground on the day that is both.
        today:
          "[&>button]:font-semibold [&>button]:underline [&>button]:decoration-primary [&>button]:decoration-2 [&>button]:underline-offset-4",
        outside: "[&>button]:text-muted-foreground/50",
        disabled: "[&>button]:pointer-events-none [&>button]:opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{ Chevron: CalendarChevron }}
      {...props}
    />
  );
}
