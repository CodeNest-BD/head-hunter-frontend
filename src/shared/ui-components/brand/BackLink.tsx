import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/shared/libs/shadCnConfig";

/**
 * The reference's `.backlink`: the muted 12.5px "back to the list" link that
 * sits above a detail page's header.
 */
export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "mb-2 inline-flex items-center gap-1.5 text-[12.5px] font-[550] text-ink-muted transition-colors hover:text-ink",
        className,
      )}
    >
      <ChevronLeft className="size-3.5" aria-hidden="true" />
      {children}
    </Link>
  );
}
