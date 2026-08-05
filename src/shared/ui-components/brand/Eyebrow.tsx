import type { ReactNode } from "react";
import { cn } from "@/shared/libs/shadCnConfig";

interface EyebrowProps {
  children: ReactNode;
  /** The pulsing brand dot from the mock's "COMING SOON" pill. */
  dot?: boolean;
  className?: string;
}

/**
 * The mock's eyebrow pill: a hairline light-blue border, uppercase wide-tracked
 * caption, and (optionally) the pulsing brand dot. Used as a section/page label
 * so headers echo the "Under Development" identity. Exact values from the mock:
 * border rgba(96,165,250,.4), text #93c5fd, dot #3b82f6.
 */
export function Eyebrow({ children, dot = true, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[#60a5fa]/40 px-3.5 py-1.5",
        "text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-[#93c5fd]",
        className,
      )}
    >
      {dot && (
        <span className="h-[7px] w-[7px] rounded-full bg-[#3b82f6] [animation:hh-pulse_1.8s_ease-in-out_infinite]" />
      )}
      {children}
    </span>
  );
}
