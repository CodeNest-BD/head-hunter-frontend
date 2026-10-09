import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The design's one control: 40px tall on an 8px radius with a 14px/500 label
 * and an 8px icon gap. Four variants and no more — a filled primary, an
 * outlined secondary, a bare text action, and a destructive that is outlined
 * in red rather than filled with it.
 *
 * `sm` is 38px, the height the table toolbars use; `xs` is the 32px pager
 * button. Both are the same radius — the design has exactly one.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-transparent text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-blue text-white hover:bg-blue-deep",
        secondary: "bg-tint text-blue-ink hover:bg-tint-strong",
        outline: "border-line-strong bg-surface text-ink hover:bg-surface-sub",
        /** The design's "Text" button: brand ink, no box. */
        ghost: "text-blue-ink hover:bg-tint",
        /** Danger is outlined in red, never filled with it. */
        destructive: "border-bad-line bg-surface text-bad hover:bg-bad-bg",
        link: "h-auto p-0 text-blue-ink underline-offset-2 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        /** 38px — the height a table toolbar's controls share. */
        sm: "h-9.5 px-3.5 text-sub",
        /** 32px — the pager and other in-card controls. */
        xs: "h-8 px-2.5 text-sub",
        lg: "h-10.5 px-4.5",
        icon: "size-10 p-0",
        "icon-sm": "size-9.5 p-0",
        "icon-xs": "size-8 p-0 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
