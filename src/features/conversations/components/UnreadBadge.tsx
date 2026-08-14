interface UnreadBadgeProps {
  count: number;
}

/** Nothing renders at zero — a badge reading "0" is noise, not information. */
export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count === 0) {
    return null;
  }
  return (
    <span
      aria-label={`${count} unread messages`}
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary-foreground"
    >
      {count}
    </span>
  );
}
