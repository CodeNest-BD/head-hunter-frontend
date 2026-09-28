import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The reference's `.btn`: a 36px control on an 8px radius, 13px/600 label,
 * 7px icon gap, 15px stroke icons, and a 1px border on every variant so the
 * outlined and filled buttons share a hit box.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[7px] whitespace-nowrap rounded-sm border border-transparent text-sub font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-[15px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-blue text-white shadow-e1 hover:bg-blue-deep",
        secondary: "bg-tint text-blue-ink hover:bg-tint-strong",
        outline: "border-line-strong bg-surface text-ink hover:bg-surface-sub",
        ghost: "text-ink-muted hover:bg-surface-sub hover:text-ink",
        /** The reference styles danger as a red-on-white outline, not a fill. */
        destructive: "border-bad-line bg-surface text-bad hover:bg-bad-bg",
        link: "h-auto p-0 font-[550] text-blue-ink underline-offset-2 hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-7.5 rounded-xs px-2.5 text-[12.5px]",
        lg: "h-10.5 px-4.5 text-block",
        /** `.iconbtn` — a 34px square with no label. */
        icon: "size-8.5 rounded-sm p-0 [&_svg]:size-[17px]",
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
