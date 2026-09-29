"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/libs/shadCnConfig";
import { MENU_OPTION_LIST } from "./menuStyles";

/**
 * Radix's Select, with one guard on the way out.
 *
 * Radix mirrors the value into a hidden native `<select>` so the control
 * submits with a form. A native select silently coerces a value whose
 * `<option>` it does not have to "" and reports that as a change — and the
 * options are registered by the items' own effects, so a value written
 * programmatically (a form prefilling itself from an API response) is applied
 * a beat before the option exists and comes straight back as "cleared".
 *
 * A user's choice can never produce "": Radix rejects an item whose value is an
 * empty string. So an empty value here is only ever that coercion, and dropping
 * it costs nothing while keeping every asynchronously-filled select from
 * silently emptying itself.
 */
function Select({
  onValueChange,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return (
    <SelectPrimitive.Root
      {...props}
      onValueChange={(value) => {
        if (value !== "") onValueChange?.(value);
      }}
    />
  );
}

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // `.select` — the `.input` shell with a 12px caret 10px in from the edge.
      "flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-sm border border-line-strong bg-surface px-[11px] text-body text-ink transition-colors focus:border-blue focus:shadow-focus focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted data-[placeholder]:text-ink-faint [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        className="size-3 shrink-0 text-ink-muted"
        strokeWidth={2.5}
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-sm border border-line bg-surface text-ink shadow-pop",
        position === "popper" && "translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          MENU_OPTION_LIST,
          position === "popper" &&
            "w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-xs py-1.5 pl-2.5 pr-8 text-sub text-ink-body outline-none focus:bg-tint focus:text-blue-ink data-[state=checked]:font-[550] data-[state=checked]:text-blue-ink data-[disabled]:pointer-events-none data-[disabled]:opacity-55",
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-3.5 text-blue" strokeWidth={2.5} />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
