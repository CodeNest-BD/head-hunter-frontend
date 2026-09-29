"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/shared/libs/shadCnConfig";

const Tabs = TabsPrimitive.Root;

/** The reference's `.tabs`: a shared bottom rule with a 2px cobalt underline
 * marking the active tab. */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    // Triggers are `whitespace-nowrap`, so a three-tab bar is wider than a
    // phone: scroll the bar itself rather than letting it widen the page.
    //
    // The bar's rule is an inset shadow, not a border. `overflow-x-auto` forces
    // `overflow-y` to compute as `auto` too, so the 1px a `-mb-px` trigger used
    // to hang below the bar was enough to raise a vertical scrollbar for a
    // single pixel. An inset shadow adds no height, and the active trigger's
    // own 2px border paints over it — same look, nothing to scroll.
    className={cn(
      "flex items-center gap-0.5 overflow-x-auto shadow-[inset_0_-1px_0_var(--line)]",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/** `.tabs__tab` — 9px/13px padding, 13px/600 label, -1px so the active
 * underline sits on top of the list's own rule. */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center gap-[7px] whitespace-nowrap border-b-2 border-transparent px-[13px] py-[9px] text-sub font-semibold text-ink-muted transition-colors hover:text-ink focus-visible:outline-none data-[state=active]:border-blue data-[state=active]:text-blue [&_svg]:size-[15px]",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-4 focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
