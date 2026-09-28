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
      className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue px-1.5 text-[10.5px] font-bold tabular-nums text-white"
    >
      {count}
    </span>
  );
}
